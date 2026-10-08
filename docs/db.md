# PostgreSQL code notes

## Connection pool

`shared/db.ts` creates one reusable `pg.Pool` for every service process:

```ts
export const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? "localhost",
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
});
```

The environment fallbacks make local compose usable; production compose supplies every Postgres setting explicitly. A pool avoids making a new database connection per request or Kafka event.

## Minute bucket writes

The three consumer handlers turn each event time into a minute bucket before calling their database service:

```ts
const bucket = new Date(event.timestamp);
bucket.setSeconds(0, 0);
```

The matching writes in `traffic-service/src/services/dbService.ts`, `error-service/src/services/dbService.ts`, and `performance-service/src/services/dbService.ts` use the schema's unique keys with `ON CONFLICT`. That collapses events for the same minute and dimension into a single aggregate row.

```sql
ON CONFLICT(bucket, page)
DO UPDATE SET views = traffic_metrics.views + 1
```

The performance equivalent adds duration and request count, so the dashboard can calculate a weighted average rather than averaging averages.

## Chart reads

`dashboard-service/controllers/dashboard-chart-controller.ts` limits every chart query to the selected interval:

```sql
WHERE bucket >= NOW() - $1::interval
```

The `bucket` indexes declared in `database/init.sql` support this predicate. Since the longest accepted interval is 24 hours, old demo rows are expected to stop appearing; see [demo-metrics-scheduler.md](demo-metrics-scheduler.md).
