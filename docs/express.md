# Express code notes

## Application middleware

Both application factories configure security headers and JSON parsing before their routes:

```ts
app.use(helmet());
app.use(express.json());
```

`ingestion-service/src/app.ts` then stores the connected Kafka producer on the request object before routing. `dashboard-service/app.ts` mounts `/charts` and exposes `/health` for load-balancer checks.

## Errors and shutdown

Route handlers pass operational errors to Express with `next(error)`. The central error middleware is registered after the routes so Express selects it only for errors.

The ingestion and dashboard servers retain the instance returned by `listen`, close it on `SIGINT` and `SIGTERM`, then close Kafka/Redis connections before exiting. This lets the load balancer drain a process instead of interrupting an in-flight request.
