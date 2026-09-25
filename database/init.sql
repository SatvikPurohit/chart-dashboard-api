CREATE TABLE
    traffic_metrics (
        id BIGSERIAL PRIMARY KEY,
        bucket TIMESTAMPTZ NOT NULL,
        page VARCHAR(500) NOT NULL,
        views BIGINT NOT NULL DEFAULT 0,
        UNIQUE (bucket, page)
    )
CREATE TABLE
    error_metrics (
        id BIGSERIAL PRIMARY KEY,
        bucket TIMESTAMPTZ NOT NULL,
        error_type VARCHAR(200) NOT NULL,
        count BIGINT NOT NULL DEFAULT 0,
        UNIQUE (bucket, error_type)
    );

CREATE TABLE
    performance_metrics (
        id BIGSERIAL PRIMARY KEY,
        bucket TIMESTAMPTZ NOT NULL,
        endpoint VARCHAR(500) NOT NULL,
        total_duration BIGINT NOT NULL DEFAULT 0,
        request_count BIGINT NOT NULL DEFAULT 0,
        UNIQUE (bucket, endpoint)
    );

CREATE INDEX idx_traffic_bucket ON traffic_metrics (bucket);

CREATE INDEX idx_error_bucket ON error_metrics (bucket);

CREATE INDEX idx_performance_bucket ON performance_metrics (bucket);