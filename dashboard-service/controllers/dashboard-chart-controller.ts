import { Request, Response, NextFunction } from "express";
import { getWithLock } from "../../shared/cache.js";
import { pool } from "../../shared/db.js";
const RANGE_INTERVALS = {
  "15m": "15 minutes",
  "1h": "1 hour",
  "6h": "6 hours",
  "24h": "24 hours",
} as const;

type DashboardRange = keyof typeof RANGE_INTERVALS;

function getRange(req: Request): DashboardRange {
  const range = req.query.range;
  return typeof range === "string" && range in RANGE_INTERVALS
    ? (range as DashboardRange)
    : "1h";
}

// Type definitions matching what our Postgres database returns
export interface ErrorChartRow {
  error_type: string;
  count: string;
}

export interface PerformanceChartRow {
  bucket: string;
  avg_latency_ms: number | null;
}

// Controller 1. Traffic Chart Endpoint Controller
export async function getTrafficChartData(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const range = getRange(req);
    // Wrap our SQL command inside the loader function block
    const chartData = await getWithLock({
      key: `pulse:chart:traffic:${range}`,
      ttlSeconds: 20, // Expire data cache in 20 seconds, Keep cached data in Redis for a baseline of 20 seconds
      loader: async () => {
        console.log("Cache Missed! Running expensive Postgres query...");
        const queryText = `
          SELECT bucket, SUM(views)::bigint AS views
          FROM traffic_metrics
          WHERE bucket >= NOW() - $1::interval
          GROUP BY bucket
          ORDER BY bucket
        `;
        const { rows } = await pool.query(queryText, [RANGE_INTERVALS[range]]);
        return rows; // This matches the data variable returned by the wrapper
      },
    });

    res.status(200).json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    next(error); // Route any internal connection faults directly to central handler middleware [M1]
  }
}

// Controller 2: Exposes error analytics chart metric payloads
export async function getErrorChart(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const range = getRange(req);
    const result = await getWithLock<ErrorChartRow[]>({
      key: `pulse:chart:errors:${range}`,
      ttlSeconds: 30,
      loader: async () => {
        console.log(" Cache Missed! Fetching error data from Postgres.");
        const { rows } = await pool.query(
          `
          SELECT error_type, SUM(count)::bigint AS count
          FROM error_metrics
          WHERE bucket >= NOW() - $1::interval
          GROUP BY error_type
          ORDER BY count DESC
        `,
          [RANGE_INTERVALS[range]],
        );
        return rows;
      },
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Controller : Calculates average system latencies and latency windows
export async function getPerformanceChart(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const range = getRange(req);
    const result = await getWithLock<PerformanceChartRow[]>({
      key: `pulse:chart:performance:${range}`,
      ttlSeconds: 20,
      loader: async () => {
        console.log(
          " Cache Missed! Calculating system latencies from Postgres.",
        );
        const { rows } = await pool.query(
          `
          SELECT bucket, SUM(total_duration) / NULLIF(SUM(request_count), 0) AS avg_latency_ms
          FROM performance_metrics
          WHERE bucket >= NOW() - $1::interval
          GROUP BY bucket
          ORDER BY bucket
        `,
          [RANGE_INTERVALS[range]],
        );
        return rows;
      },
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
