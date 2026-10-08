# Source-comment index

This index keeps the explanatory material out of the execution path while preserving the code it describes. The snippets below are the source lines the comments apply to; the linked document contains the explanation.

| Source area | Code lines described | Documentation |
| --- | --- | --- |
| `shared/db.ts` | `export const pool = new Pool({ ... max: 20, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 2_000 })` | [db.md](db.md#connection-pool) |
| `traffic-service/src/handlers/trafficHandler.ts` | `if (!message.value) return;`, `if (event.eventType !== "PAGE_VIEWED") return;`, `bucket.setSeconds(0, 0);`, and `await upsertTrafficMetric(...)` | [db.md](db.md#minute-bucket-writes), [kafka.md](kafka.md#code-notes-the-event-pipeline) |
| `error-service/src/handlers/errorHandler.ts` | `if (!message.value) return;`, `if (event.eventType !== "ERROR_OCCURRED") return;`, `bucket.setSeconds(0, 0);`, and `await upsertErrorMetric(...)` | [db.md](db.md#minute-bucket-writes), [kafka.md](kafka.md#code-notes-the-event-pipeline) |
| `performance-service/src/handlers/trafficHandler.ts` | `if (!message.value) return;`, `if (event.eventType !== "PAGE_VIEWED") return;`, `bucket.setSeconds(0, 0);`, and `await upsertPerformanceMetric(...)` | [db.md](db.md#minute-bucket-writes), [kafka.md](kafka.md#code-notes-the-event-pipeline) |
| worker entrypoints | `kafka.consumer({ groupId })`, `consumer.subscribe({ topic: "analytics.raw", fromBeginning: false })`, and signal handlers that disconnect consumers and close pools | [kafka.md](kafka.md#code-notes-the-event-pipeline), [express.md](express.md#errors-and-shutdown) |
| `ingestion-service/src/controllers/eventController.ts` | `crypto.randomUUID()`, `new Date().toISOString()`, and `req.kafkaProducer?.send({ topic: "analytics.raw", ... })` | [kafka.md](kafka.md#code-notes-the-event-pipeline) |
| `ingestion-service/src/middleware/validateEvent.ts` | `if (!eventType || !data) return res.status(400)...` followed by `next()` | [express.md](express.md#application-middleware) |
| `ingestion-service/src/app.ts` | `app.use(helmet())`, `app.use(express.json())`, producer injection middleware, route registration, and central error middleware | [express.md](express.md#application-middleware) |
| `ingestion-service/src/server.ts` and `dashboard-service/server.ts` | `server.close(...)`, Kafka/Redis shutdown, and the forced-close timeout | [express.md](express.md#errors-and-shutdown) |
| `dashboard-service/app.ts` and `routes/dashboard-route.ts` | `app.use(helmet())`, `app.use(express.json())`, `app.use("/charts", dashboardRouter)`, and the `/health` route | [express.md](express.md#application-middleware) |
| `dashboard-service/controllers/dashboard-chart-controller.ts` | `getRange(...)`, `getWithLock(...)`, `WHERE bucket >= NOW() - $1::interval`, and `next(error)` | [db.md](db.md#chart-reads), [redis.md](redis.md) |
| `shared/cache.ts` | Cache check, `redis.set(... { NX: true, PX: 5_000 })`, jittered `redis.set`, polling, and Lua compare-and-delete | [redis.md](redis.md) |
| `shared/kafka.ts` | `new Kafka({ brokers: ... })` and producer/consumer sharing | [kafka.md](kafka.md#code-notes-the-event-pipeline) |
| `shared/redis.ts` | `createClient`, reconnect backoff, and error listener | [redis.md](redis.md) |
| `shared/corsConfig.ts` | The localhost origins and CloudFront origin in the allowed origin list | [express.md](express.md#application-middleware) |
| event type definitions | The open `data` field (`[key: string]: any`) | The field permits event-specific payload members; validation remains at the ingestion boundary in [express.md](express.md#application-middleware). |
| `docker-compose.yml` | Redis eviction, Kafka listener, advertised listener, development fallback, and bridge-network settings | [kafka.md](kafka.md), [redis.md](redis.md) |
| `docker-compose-prod.yml` | Schema bootstrap, KRaft ID, service roles, and the local Postgres volume | [aws.md](aws.md#local-instance-data-boundary), [demo-metrics-scheduler.md](demo-metrics-scheduler.md#compose-job) |
| `deploy-backend.sh` | ASG discovery, SSM-online filtering, remote deployment, metadata lookup, and deployment-result reporting | [aws.md](aws.md#instance-deployment) |

## New demo scheduler code

| Source area | Code lines described | Documentation |
| --- | --- | --- |
| `database/seed-demo-metrics.sql` | The `generate_series(0, 288)` rolling buckets and all three `INSERT ... ON CONFLICT` statements | [demo-metrics-scheduler.md](demo-metrics-scheduler.md#data-seed) |
| compose `demo-metrics-seeder` | `psql -v ON_ERROR_STOP=1 -f /seed/seed-demo-metrics.sql` and its `db-init` dependency | [demo-metrics-scheduler.md](demo-metrics-scheduler.md#compose-job) |
| `infra/demo-metrics-schedule.yml` | `rate(10 minutes)`, ASG-tag target selection, and the SSM `docker compose run --rm --no-deps` command | [demo-metrics-scheduler.md](demo-metrics-scheduler.md#aws-schedule) |
