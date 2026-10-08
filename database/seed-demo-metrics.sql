BEGIN;

WITH buckets AS (
  SELECT date_trunc('minute', NOW()) - step * INTERVAL '5 minutes' AS bucket
  FROM generate_series(0, 288) AS step
)
INSERT INTO traffic_metrics (bucket, page, views)
SELECT
  bucket,
  '/__demo/dashboard',
  40 + MOD(EXTRACT(EPOCH FROM bucket)::bigint / 300, 80)
FROM buckets
ON CONFLICT (bucket, page)
DO NOTHING;

WITH buckets AS (
  SELECT date_trunc('minute', NOW()) - step * INTERVAL '5 minutes' AS bucket
  FROM generate_series(0, 288) AS step
), error_types AS (
  SELECT * FROM (VALUES
    ('ValidationError', 2::bigint),
    ('TimeoutError', 1::bigint),
    ('UpstreamError', 1::bigint)
  ) AS values_by_type(error_type, count)
)
INSERT INTO error_metrics (bucket, error_type, count)
SELECT bucket, error_type, count
FROM buckets
CROSS JOIN error_types
ON CONFLICT (bucket, error_type)
DO NOTHING;

WITH buckets AS (
  SELECT date_trunc('minute', NOW()) - step * INTERVAL '5 minutes' AS bucket
  FROM generate_series(0, 288) AS step
), endpoints AS (
  SELECT * FROM (VALUES
    ('/__demo/api/dashboard', 110::bigint, 12::bigint),
    ('/__demo/api/events', 180::bigint, 8::bigint)
  ) AS values_by_endpoint(endpoint, latency_ms, request_count)
)
INSERT INTO performance_metrics (bucket, endpoint, total_duration, request_count)
SELECT bucket, endpoint, latency_ms * request_count, request_count
FROM buckets
CROSS JOIN endpoints
ON CONFLICT (bucket, endpoint)
DO NOTHING;

COMMIT;
