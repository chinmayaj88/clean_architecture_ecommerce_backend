.PHONY: help build test lint format dev dev-down clean install generate-prisma migrate-auth migrate-user migrate-product migrate-all seed-auth seed-user seed-product seed-all setup-auth setup-user setup-all studio-auth studio-user studio-product test-auth test-user test-product

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install all dependencies
	npm install

generate-prisma: ## Generate Prisma clients for all services
	@echo "Generating Prisma clients for all services..."
	cd services/auth-service && npm run prisma:generate
	cd services/user-service && npm run prisma:generate
	@echo "✅ All Prisma clients generated"

build: ## Build all services
	$(MAKE) generate-prisma
	npm run build

test: ## Run all tests
	npm run test

test-auth: ## Run auth-service tests
	cd services/auth-service && npm test

test-user: ## Run user-service tests
	cd services/user-service && npm test

test-product: ## Run product-service tests
	cd services/product-service && npm test

lint: ## Lint all code
	npm run lint

format: ## Format all code
	npm run format

dev: ## Start local development environment
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Waiting for services to be ready..."
ifeq ($(DETECTED_OS),Windows)
	@timeout /t 5 /nobreak >nul 2>&1 || powershell -Command "Start-Sleep -Seconds 5"
else
	@sleep 5
endif
	@echo "Development environment is ready!"

dev-down: ## Stop local development environment
	docker-compose -f docker-compose.dev.yml down

clean: ## Clean all build artifacts and dependencies
	npm run clean

# Database Migrations
migrate-auth: ## Run auth-service database migrations
	@echo "Running migrations for auth-service..."
	cd services/auth-service && npm run prisma:generate && npm run prisma:migrate:deploy
	@echo "✅ Auth-service migrations completed"

migrate-user: ## Run user-service database migrations
	@echo "Running migrations for user-service..."
	cd services/user-service && npm run prisma:generate && npm run prisma:migrate:deploy
	@echo "✅ User-service migrations completed"

migrate-product: ## Run product-service database migrations (when implemented)
	@echo "Running migrations for product-service..."
	@echo "⚠️  Product service migrations not yet implemented"

migrate-all: ## Run migrations for all services
	@echo "Running migrations for all services..."
	$(MAKE) migrate-auth
	$(MAKE) migrate-user
	@echo "✅ All migrations completed"

# Database Seeding
seed-auth: ## Seed auth-service database with default data
	@echo "Seeding auth-service database..."
	cd services/auth-service && npm run prisma:seed
	@echo "✅ Auth-service database seeded"

seed-user: ## Seed user-service database (when implemented)
	@echo "Seeding user-service database..."
	@echo "⚠️  User service seeding not yet implemented"

seed-product: ## Seed product-service database (when implemented)
	@echo "Seeding product-service database..."
	@echo "⚠️  Product service seeding not yet implemented"

seed-all: ## Seed all service databases
	@echo "Seeding all service databases..."
	$(MAKE) seed-auth
	@echo "✅ All databases seeded"

# Detect OS (Windows or Unix-like)
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
else
    DETECTED_OS := Unix
endif

# Database Setup (migration + seed)
setup-auth: ## Complete setup for auth-service (migrate + seed)
	@echo "Setting up auth-service database..."
	@echo "Note: Ensure .env file exists with required environment variables"
ifeq ($(DETECTED_OS),Windows)
	@powershell -Command "if (-not (Test-Path 'services\auth-service\.env')) { Write-Host '⚠️  Warning: .env file not found. Please create services\auth-service\.env with required environment variables.' }"
else
	@if [ ! -f services/auth-service/.env ]; then \
		echo "⚠️  Warning: .env file not found. Please create services/auth-service/.env with required environment variables."; \
	fi
endif
	$(MAKE) migrate-auth
	$(MAKE) seed-auth
	@echo "✅ Auth-service database setup complete"

setup-user: ## Complete setup for user-service (migrate)
	@echo "Setting up user-service database..."
	@echo "Note: Ensure .env file exists with required environment variables"
ifeq ($(DETECTED_OS),Windows)
	@powershell -Command "if (-not (Test-Path 'services\user-service\.env')) { Write-Host '⚠️  Warning: .env file not found. Please create services\user-service\.env with required environment variables.' }"
else
	@if [ ! -f services/user-service/.env ]; then \
		echo "⚠️  Warning: .env file not found. Please create services/user-service/.env with required environment variables."; \
	fi
endif
	@echo "Creating initial migration if needed..."
ifeq ($(DETECTED_OS),Windows)
	@powershell -Command "$$migrationsPath = 'services\user-service\prisma\migrations'; $$hasMigrations = (Test-Path $$migrationsPath) -and ((Get-ChildItem $$migrationsPath -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0); if (-not $$hasMigrations) { Write-Host 'No migrations found, creating initial migration...'; Set-Location services\user-service; npm.cmd run prisma:generate; npx.cmd prisma migrate dev --name init --skip-seed; Set-Location ..\.. } else { Write-Host 'Migrations found, running migrate-user...'; Set-Location services\user-service; npm.cmd run prisma:generate; npm.cmd run prisma:migrate:deploy; Set-Location ..\.. }"
else
	@if [ ! -d "services/user-service/prisma/migrations" ] || [ -z "$$(ls -A services/user-service/prisma/migrations 2>/dev/null)" ]; then \
		echo "No migrations found, creating initial migration..."; \
		cd services/user-service && npm run prisma:generate && npx prisma migrate dev --name init --skip-seed || true; \
	else \
		$(MAKE) migrate-user; \
	fi
endif
	@echo "✅ User-service database setup complete"

setup-all: ## Complete setup for all services (migrate + seed)
	@echo "Setting up all service databases..."
	$(MAKE) setup-auth
	$(MAKE) setup-user
	@echo "✅ All service databases setup complete"

# Prisma Studio (database GUI)
studio-auth: ## Open Prisma Studio for auth-service
	cd services/auth-service && npm run prisma:studio

studio-user: ## Open Prisma Studio for user-service
	cd services/user-service && npx prisma studio --port 5556

studio-product: ## Open Prisma Studio for product-service (when implemented)
	@echo "⚠️  Product service Prisma Studio not yet implemented"

