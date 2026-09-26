import { Response, NextFunction } from "express";
import { getWithLock } from "../../shared/cache.js";
import { pool } from "../../shared/db.js";
import { DashboardRequest } from "../types/dashboard-request.js";

export const CACHE_KEY = "pulse:chart:traffic:1h";

export async function getTrafficChartData(
  req: DashboardRequest,
  res: Response,
  next: NextFunction,
): Promise<any> {
  try {
    // Wrap your SQL command inside the loader function block
    const chartData = await getWithLock({
      key: CACHE_KEY,
      ttlSeconds: 30, // Expire data cache in 30 seconds
      loader: async () => {
        console.log("Cache Missed! Running expensive Postgres query...");
        const queryText = `
          SELECT bucket, SUM(views)::bigint AS views
          FROM traffic_metrics
          WHERE bucket >= NOW() - INTERVAL '1 hour'
          GROUP BY bucket
          ORDER BY bucket
        `;
        const { rows } = await pool.query(queryText);
        return rows; // This matches the data variable returned by the wrapper
      },
    });

    return res.status(200).json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    next(error); // Route any internal connection faults directly to central handler middleware [M1]
  }
}
