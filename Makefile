.PHONY: up down restart migrate seed logs build prod-up prod-down prod-logs shell

up:
	docker compose up --build

down:
	docker compose down

restart:
	docker compose restart

migrate:
	docker compose exec app npx prisma db push

seed:
	docker compose exec app npx tsx scripts/seed.ts

logs:
	docker compose logs -f

shell:
	docker compose exec app sh

prod-up:
	docker compose -f docker-compose.prod.yml up --build -d

prod-down:
	docker compose -f docker-compose.prod.yml down

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f
