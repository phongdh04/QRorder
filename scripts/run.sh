#!/bin/bash
ACTION=${1:-up}

case "$ACTION" in
  up)
    docker compose up --build
    ;;
  down)
    docker compose down
    ;;
  restart)
    docker compose restart
    ;;
  migrate)
    docker compose exec app npx prisma db push
    ;;
  seed)
    docker compose exec app npx tsx scripts/seed.ts
    ;;
  logs)
    docker compose logs -f
    ;;
  prod-up)
    docker compose -f docker-compose.prod.yml up --build -d
    ;;
  prod-down)
    docker compose -f docker-compose.prod.yml down
    ;;
  prod-logs)
    docker compose -f docker-compose.prod.yml logs -f
    ;;
  *)
    echo "Usage: $0 {up|down|restart|migrate|seed|logs|prod-up|prod-down|prod-logs}"
    exit 1
    ;;
esac
