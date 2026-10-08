# AWS deployment code notes

## Instance deployment

`deploy-backend.sh` discovers `InService` members of `dashboard-charts-pulse-auto-scaling-group`, filters to SSM-online instances, and sends a remote deployment command. The remote command updates the checked-out repository, downloads the encrypted `.env.prod` parameter, and starts compose:

```sh
sudo docker compose --env-file .env.prod -f docker-compose-prod.yml down
sudo docker compose --env-file .env.prod -f docker-compose-prod.yml up -d --build
```

`down` without `-v` preserves each instance's Docker volumes. It does not make those volumes shared between Auto Scaling Group members.

## Local-instance data boundary

`docker-compose-prod.yml` gives Postgres this named volume:

```yaml
volumes:
  - pgdata:/var/lib/postgresql/data
```

Because compose runs on each EC2 host, each host owns a separate `pgdata`. Requests load-balanced across instances can therefore read different metric datasets. The scheduled demo seeder targets all ASG members to keep the demo experience consistent.

## Scheduled demo refresh

The EventBridge-to-SSM configuration and deployment command are documented in [demo-metrics-scheduler.md](demo-metrics-scheduler.md). The rule targets the ASG tag rather than fixed instance IDs, so replacement instances are included automatically.
