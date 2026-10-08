# Redis cache code notes

`shared/cache.ts` implements cache-aside reads with a short-lived distributed lock. The first request checks the cache, then attempts a Redis `SET` guarded by `NX` and `PX`:

```ts
const didAcquireLock = await redis.set(lockKey, lockToken, {
  NX: true,
  PX: 5_000,
});
```

`NX` ensures only one request runs the expensive loader. `PX` bounds the lock lifetime if that request fails. The winner checks the cache again, loads PostgreSQL on a genuine miss, and caches the result with a small random TTL jitter. Other requests poll briefly for the winner's cached result.

The release is a Lua compare-and-delete operation: it removes the lock only if the token in Redis still belongs to the current caller. That prevents an expired request from deleting a later request's lock.

```ts
await redis.eval(
  "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end",
  { keys: [lockKey], arguments: [lockToken] },
);
```
