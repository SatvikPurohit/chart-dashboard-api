import { pool } from "../../../shared/db.js";

export const upsertTrafficMetric = async (
  bucket: Date,
  page: string,
): Promise<void> => {
  const upsertQueryText = `
    INSERT INTO traffic_metrics(
        bucket,
        page,
        views
    )
    values(
        $1,
        $2,
        1
    )
    ON CONFLICT(bucket, page)
    DO UPDATE SET views =  traffic_metrics.views + 1
`;
  await pool.query(upsertQueryText, [bucket, page]);
};
