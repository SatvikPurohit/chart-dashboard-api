import { pool } from "../../../shared/db.js";

export const upsertPerformanceMetric = async (
  bucket: Date,
  endpoint: string,
  durationMs: number,
): Promise<void> => {
  const upsertQueryText = `
    INSERT INTO performance_metrics(
        bucket,
        endpoint,
        total_duration,
        request_count
    )
    values(
        $1,
        $2,
        $3,
        1
    )
    ON CONFLICT(bucket, end_point)
    DO UPDATE SET total_duration =  performance_metrics.total_duration + EXCLUDED.total_duration
`;
  await pool.query(upsertQueryText, [bucket, endpoint, durationMs]);
};
