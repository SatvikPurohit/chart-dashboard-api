import { pool } from "../../../shared/db.js";

export const upsertErrorMetric = async (
  bucket: Date,
  errorType: string,
): Promise<void> => {
  const upsertQueryText = `
    INSERT INTO error_metrics(
        bucket,
        error_type,
        count
    )
    values(
        $1,
        $2,
        1
    )
    ON CONFLICT(bucket, error_type)
    DO UPDATE SET count =  error_metrics.count + 1
`;
  await pool.query(upsertQueryText, [bucket, errorType]);
};
