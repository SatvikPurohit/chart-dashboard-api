# Rolling demo metrics scheduler

The chart API deliberately filters every query to a recent range:

```ts
WHERE bucket >= NOW() - $1::interval
```

The supported values are `15 minutes`, `1 hour`, `6 hours`, and `24 hours` in `dashboard-service/controllers/dashboard-chart-controller.ts`. Static seed rows eventually fall outside all of those ranges. The scheduler keeps a rolling 24-hour dataset in each backend instance's local PostgreSQL volume.

## Data seed

`database/seed-demo-metrics.sql` creates one five-minute bucket for each point in the latest 24 hours, including the current bucket:

```sql
SELECT date_trunc('minute', NOW()) - step * INTERVAL '5 minutes' AS bucket
FROM generate_series(0, 288) AS step
```

That is 289 buckets: enough for every current chart range. It upserts three deliberately namespaced demo dimensions:

```sql
INSERT INTO traffic_metrics (bucket, page, views)
-- page: /__demo/dashboard

INSERT INTO error_metrics (bucket, error_type, count)
-- error types: ValidationError, TimeoutError, UpstreamError

INSERT INTO performance_metrics (bucket, endpoint, total_duration, request_count)
-- endpoints: /__demo/api/dashboard and /__demo/api/events
```

`ON CONFLICT DO NOTHING` means subsequent runs add only the buckets that are missing. They neither rewrite the existing 24-hour demo history nor change production rows.

## Compose job

The `demo-metrics-seeder` service in both compose files runs the SQL through `psql`:

```yaml
command: ["sh", "-c", "psql -v ON_ERROR_STOP=1 -f /seed/seed-demo-metrics.sql"]
```

It runs once after `db-init` during deployment, and the dashboard service waits for that successful completion. A newly created local volume therefore has data before the chart API can serve its first request. It is not a long-running application container.

## AWS schedule

`infra/demo-metrics-schedule.yml` provisions an EventBridge rule with this cadence:

```yaml
ScheduleExpression: rate(10 minutes)
```

Ten minutes is intentional: it halves the SSM and container starts compared with a five-minute cadence while still guaranteeing a bucket no more than ten minutes old. That leaves a five-minute safety margin inside the shortest, 15-minute chart filter.

The target is the AWS-managed `AWS-RunShellScript` SSM document. It selects **all** current ASG instances by the Auto Scaling Group tag and runs this exact command on each one:

```sh
cd /home/ubuntu/pulse-dashboard && \
  sudo docker compose --env-file .env.prod -f docker-compose-prod.yml \
  run --rm --no-deps demo-metrics-seeder
```

The `--no-deps` flag ensures the schedule only starts the one-shot seeder against the already-running local Postgres. This matters because this deployment currently has one Postgres volume per EC2 instance.

## Deploy

After the backend commit is deployed to the instances, create or update the schedule:

```sh
aws cloudformation deploy \
  --region ap-south-1 \
  --stack-name pulse-dashboard-demo-metrics-schedule \
  --template-file infra/demo-metrics-schedule.yml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    AutoScalingGroupName=dashboard-charts-pulse-auto-scaling-group \
    ProjectDirectory=/home/ubuntu/pulse-dashboard
```

Verify it after five minutes:

```sh
curl -sS 'https://dpc690ulfwxnu.cloudfront.net/charts/traffic?range=15m'
curl -sS 'https://dpc690ulfwxnu.cloudfront.net/charts/errors?range=1h'
curl -sS 'https://dpc690ulfwxnu.cloudfront.net/charts/performance?range=24h'
```

## Operational boundary

This is intentionally demo-only. Its values are included in the normal chart aggregates. Disable or delete the CloudFormation stack before using the charts as production telemetry, and use a shared database (for example RDS) for a multi-instance real-metrics deployment.
