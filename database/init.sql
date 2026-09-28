CREATE TABLE IF NOT EXISTS
    traffic_metrics (
        id BIGSERIAL PRIMARY KEY,
        bucket TIMESTAMPTZ NOT NULL,
        page VARCHAR(500) NOT NULL,
        views BIGINT NOT NULL DEFAULT 0,
        UNIQUE (bucket, page)
    );

CREATE TABLE IF NOT EXISTS
    error_metrics (
        id BIGSERIAL PRIMARY KEY,
        bucket TIMESTAMPTZ NOT NULL,
        error_type VARCHAR(200) NOT NULL,
        count BIGINT NOT NULL DEFAULT 0,
        UNIQUE (bucket, error_type)
    );

CREATE TABLE IF NOT EXISTS
    performance_metrics (
        id BIGSERIAL PRIMARY KEY,
        bucket TIMESTAMPTZ NOT NULL,
        endpoint VARCHAR(500) NOT NULL,
        total_duration BIGINT NOT NULL DEFAULT 0,
        request_count BIGINT NOT NULL DEFAULT 0,
        UNIQUE (bucket, endpoint)
    );

CREATE INDEX IF NOT EXISTS idx_traffic_bucket ON traffic_metrics (bucket);

CREATE INDEX IF NOT EXISTS idx_error_bucket ON error_metrics (bucket);

CREATE INDEX IF NOT EXISTS idx_performance_bucket ON performance_metrics (bucket);
