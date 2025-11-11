.PHONY: help build build-auth build-user build-product build-cart build-gateway build-notification build-discount build-shipping build-return test lint format dev dev-down clean install generate-prisma migrate-auth migrate-user migrate-product migrate-notification migrate-discount migrate-shipping migrate-return migrate-all seed-auth seed-user seed-product seed-all setup-auth setup-user setup-notification setup-discount setup-shipping setup-return setup-all studio-auth studio-user studio-product studio-notification studio-discount studio-shipping studio-return test-auth test-user test-product

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install all dependencies
	npm install

generate-prisma: ## Generate Prisma clients for all services (for setup/development)
	@echo "Generating Prisma clients for all services..."
	@echo "⚠️  Note: In a monorepo, Prisma clients overwrite each other in shared node_modules."
	@echo "   For individual service builds (recommended for microservices), use:"
	@echo "   - make build-auth   (generates client + builds auth-service)"
	@echo "   - make build-user   (generates client + builds user-service)"
	@echo "   - make build-product (generates client + builds product-service)"
	@echo "   - make build-cart    (generates client + builds cart-service)"
	@echo "   This ensures each service builds with its own Prisma client."
	cd services/auth-service && npm run prisma:generate
	cd services/user-service && npm run prisma:generate
	cd services/product-service && npm run prisma:generate
	cd services/cart-service && npm run prisma:generate
	cd services/order-service && npm run prisma:generate
	cd services/payment-service && npm run prisma:generate
	cd services/notification-service && npm run prisma:generate
	cd services/discount-service && npm run prisma:generate
	cd services/shipping-service && npm run prisma:generate
	cd services/return-service && npm run prisma:generate
	@echo "✅ All Prisma clients generated"

build: ## Build all services (generates Prisma clients and builds each service individually)
	@echo "Building all services..."
	@echo "Note: Each service generates its own Prisma client before building to avoid conflicts"
	@echo "This approach works because each service builds immediately after generating its client"
	cd services/auth-service && npm run prisma:generate && npm run build
	cd services/user-service && npm run prisma:generate && npm run build
	cd services/product-service && npm run prisma:generate && npm run build
	cd services/cart-service && npm run prisma:generate && npm run build
	cd services/order-service && npm run prisma:generate && npm run build
	cd services/payment-service && npm run prisma:generate && npm run build
	cd services/gateway-service && npm run build
	cd services/notification-service && npm run prisma:generate && npm run build
	cd services/discount-service && npm run prisma:generate && npm run build
	cd services/shipping-service && npm run prisma:generate && npm run build
	cd services/return-service && npm run prisma:generate && npm run build
	@echo "✅ All services built successfully"

build-auth: ## Build auth-service individually (microservice pattern)
	@echo "Building auth-service..."
	cd services/auth-service && npm run prisma:generate && npm run build
	@echo "✅ Auth-service built successfully"

build-user: ## Build user-service individually (microservice pattern)
	@echo "Building user-service..."
	cd services/user-service && npm run prisma:generate && npm run build
	@echo "✅ User-service built successfully"

build-product: ## Build product-service individually (microservice pattern)
	@echo "Building product-service..."
	cd services/product-service && npm run prisma:generate && npm run build
	@echo "✅ Product-service built successfully"

build-cart: ## Build cart-service individually (microservice pattern)
	@echo "Building cart-service..."
	cd services/cart-service && npm run prisma:generate && npm run build
	@echo "✅ Cart-service built successfully"

build-order: ## Build order-service individually (microservice pattern)
	@echo "Building order-service..."
	cd services/order-service && npm run prisma:generate && npm run build
	@echo "✅ Order-service built successfully"

build-payment: ## Build payment-service individually (microservice pattern)
	@echo "Building payment-service..."
	cd services/payment-service && npm run prisma:generate && npm run build
	@echo "✅ Payment-service built successfully"

build-gateway: ## Build gateway-service individually (microservice pattern)
	@echo "Building gateway-service..."
	cd services/gateway-service && npm run build
	@echo "✅ Gateway-service built successfully"

build-notification: ## Build notification-service individually (microservice pattern)
	@echo "Building notification-service..."
	cd services/notification-service && npm run prisma:generate && npm run build
	@echo "✅ Notification-service built successfully"

build-discount: ## Build discount-service individually (microservice pattern)
	@echo "Building discount-service..."
	cd services/discount-service && npm run prisma:generate && npm run build
	@echo "✅ Discount-service built successfully"

build-shipping: ## Build shipping-service individually (microservice pattern)
	@echo "Building shipping-service..."
	cd services/shipping-service && npm run prisma:generate && npm run build
	@echo "✅ Shipping-service built successfully"

build-return: ## Build return-service individually (microservice pattern)
	@echo "Building return-service..."
	cd services/return-service && npm run prisma:generate && npm run build
	@echo "✅ Return-service built successfully"

test: ## Run all tests
	npm run test

test-auth: ## Run auth-service tests
	cd services/auth-service && npm test

test-user: ## Run user-service tests
	cd services/user-service && npm test

test-product: ## Run product-service tests
	cd services/product-service && npm test

test-cart: ## Run cart-service tests
	cd services/cart-service && npm test

lint: ## Lint all code
	npm run lint

format: ## Format all code
	npm run format

dev: ## Start local development environment
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Waiting for services to be ready..."
ifeq ($(OS),Windows_NT)
	@powershell -Command "Start-Sleep -Seconds 5"
else
	@sleep 5
endif
	@echo "Development environment is ready!"

dev-down: ## Stop local development environment
	docker-compose -f docker-compose.dev.yml down

clean: ## Clean all build artifacts (dist folders) from all services
ifeq ($(OS),Windows_NT)
	@powershell -NoProfile -ExecutionPolicy Bypass -Command "Write-Host 'Cleaning build artifacts (dist folders) from all services...'; Get-ChildItem -Path . -Recurse -Directory -Filter 'dist' -ErrorAction SilentlyContinue | Where-Object { $$_.FullName -notmatch 'node_modules' } | ForEach-Object { Remove-Item -Recurse -Force $$_.FullName -ErrorAction SilentlyContinue; Write-Host '[OK] Removed' $$_.FullName }; Write-Host '[OK] Clean completed'"
else
	@echo "Cleaning build artifacts (dist folders) from all services..."
	@find . -type d -name 'dist' -not -path '*/node_modules/*' -exec rm -rf {} + 2>/dev/null; true
	@echo "[OK] Clean completed"
endif

# Database Migrations
migrate-auth: ## Run auth-service database migrations
	@echo "Running migrations for auth-service..."
	cd services/auth-service && npm run prisma:generate && npm run prisma:migrate:deploy
	@echo "✅ Auth-service migrations completed"

migrate-user: ## Run user-service database migrations
	@echo "Running migrations for user-service..."
	cd services/user-service && npm run prisma:generate && npm run prisma:migrate:deploy
	@echo "✅ User-service migrations completed"

migrate-product: ## Run product-service database migrations
	@echo "Running migrations for product-service..."
	cd services/product-service && npm run prisma:generate && npm run prisma:migrate:deploy
	@echo "✅ Product-service migrations completed"

migrate-cart: ## Run cart-service database migrations
	@echo "Running migrations for cart-service..."
	cd services/cart-service && npm run prisma:generate && npm run prisma:migrate:deploy
	@echo "✅ Cart-service migrations completed"

migrate-order: ## Run order-service database migrations
	@echo "Running migrations for order-service..."
	cd services/order-service && npm run prisma:generate && npm run prisma:migrate:deploy
	@echo "✅ Order-service migrations completed"

migrate-payment: ## Run payment-service database migrations
	@echo "Running migrations for payment-service..."
	cd services/payment-service && npm run prisma:generate && npm run prisma:migrate:deploy
	@echo "✅ Payment-service migrations completed"

migrate-notification: ## Run notification-service database migrations
	@echo "Running migrations for notification-service..."
	cd services/notification-service && npm run prisma:generate && npm run prisma:migrate:deploy
	@echo "✅ Notification-service migrations completed"

migrate-discount: ## Run discount-service database migrations
	@echo "Running migrations for discount-service..."
	cd services/discount-service && npm run prisma:generate && npm run prisma:migrate:deploy
	@echo "✅ Discount-service migrations completed"

migrate-shipping: ## Run shipping-service database migrations
	@echo "Running migrations for shipping-service..."
	cd services/shipping-service && npm run prisma:generate && npm run prisma:migrate:deploy
	@echo "✅ Shipping-service migrations completed"

migrate-return: ## Run return-service database migrations
	@echo "Running migrations for return-service..."
	cd services/return-service && npm run prisma:generate && npm run prisma:migrate:deploy
	@echo "✅ Return-service migrations completed"

migrate-all: ## Run migrations for all services
	@echo "Running migrations for all services..."
	@echo "Note: Each service generates its Prisma client before migrating to avoid conflicts"
	$(MAKE) migrate-auth
	$(MAKE) migrate-user
	$(MAKE) migrate-product
	$(MAKE) migrate-cart
	$(MAKE) migrate-order
	$(MAKE) migrate-payment
	$(MAKE) migrate-notification
	$(MAKE) migrate-discount
	$(MAKE) migrate-shipping
	$(MAKE) migrate-return
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

setup-cart: ## Complete setup for cart-service (migrate)
	@echo "Setting up cart-service database..."
	@echo "Note: Ensure .env file exists with required environment variables"
ifeq ($(DETECTED_OS),Windows)
	@powershell -Command "if (-not (Test-Path 'services\cart-service\.env')) { Write-Host '⚠️  Warning: .env file not found. Please create services\cart-service\.env with required environment variables.' }"
else
	@if [ ! -f services/cart-service/.env ]; then \
		echo "⚠️  Warning: .env file not found. Please create services/cart-service/.env with required environment variables."; \
	fi
endif
	@echo "Creating initial migration if needed..."
ifeq ($(DETECTED_OS),Windows)
	@powershell -Command "$$migrationsPath = 'services\cart-service\prisma\migrations'; $$hasMigrations = (Test-Path $$migrationsPath) -and ((Get-ChildItem $$migrationsPath -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0); if (-not $$hasMigrations) { Write-Host 'No migrations found, creating initial migration...'; Set-Location services\cart-service; npm.cmd run prisma:generate; npx.cmd prisma migrate dev --name init --skip-seed; Set-Location ..\.. } else { Write-Host 'Migrations found, running migrate-cart...'; Set-Location services\cart-service; npm.cmd run prisma:generate; npm.cmd run prisma:migrate:deploy; Set-Location ..\.. }"
else
	@if [ ! -d "services/cart-service/prisma/migrations" ] || [ -z "$$(ls -A services/cart-service/prisma/migrations 2>/dev/null)" ]; then \
		echo "No migrations found, creating initial migration..."; \
		cd services/cart-service && npm run prisma:generate && npx prisma migrate dev --name init --skip-seed || true; \
	else \
		$(MAKE) migrate-cart; \
	fi
endif
	@echo "✅ Cart-service database setup complete"

setup-payment: ## Complete setup for payment-service (migrate)
	@echo "Setting up payment-service database..."
	@echo "Note: Ensure .env file exists with required environment variables"
ifeq ($(DETECTED_OS),Windows)
	@powershell -Command "if (-not (Test-Path 'services\payment-service\.env')) { Write-Host '⚠️  Warning: .env file not found. Please create services\payment-service\.env with required environment variables.' }"
else
	@if [ ! -f services/payment-service/.env ]; then \
		echo "⚠️  Warning: .env file not found. Please create services/payment-service/.env with required environment variables."; \
	fi
endif
	@echo "Creating initial migration if needed..."
ifeq ($(DETECTED_OS),Windows)
	@powershell -Command "$$migrationsPath = 'services\payment-service\prisma\migrations'; $$hasMigrations = (Test-Path $$migrationsPath) -and ((Get-ChildItem $$migrationsPath -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0); if (-not $$hasMigrations) { Write-Host 'No migrations found, creating initial migration...'; Set-Location services\payment-service; npm.cmd run prisma:generate; npx.cmd prisma migrate dev --name init --skip-seed; Set-Location ..\.. } else { Write-Host 'Migrations found, running migrate-payment...'; Set-Location services\payment-service; npm.cmd run prisma:generate; npm.cmd run prisma:migrate:deploy; Set-Location ..\.. }"
else
	@if [ ! -d "services/payment-service/prisma/migrations" ] || [ -z "$$(ls -A services/payment-service/prisma/migrations 2>/dev/null)" ]; then \
		echo "No migrations found, creating initial migration..."; \
		cd services/payment-service && npm run prisma:generate && npx prisma migrate dev --name init --skip-seed || true; \
	else \
		$(MAKE) migrate-payment; \
	fi
endif
	@echo "✅ Payment-service database setup complete"

setup-notification: ## Complete setup for notification-service (migrate)
	@echo "Setting up notification-service database..."
	@echo "Note: Ensure .env file exists with required environment variables"
ifeq ($(DETECTED_OS),Windows)
	@powershell -Command "if (-not (Test-Path 'services\notification-service\.env')) { Write-Host '⚠️  Warning: .env file not found. Please create services\notification-service\.env with required environment variables.' }"
else
	@if [ ! -f services/notification-service/.env ]; then \
		echo "⚠️  Warning: .env file not found. Please create services/notification-service/.env with required environment variables."; \
	fi
endif
	@echo "Creating initial migration if needed..."
ifeq ($(DETECTED_OS),Windows)
	@powershell -Command "$$migrationsPath = 'services\notification-service\prisma\migrations'; $$hasMigrations = (Test-Path $$migrationsPath) -and ((Get-ChildItem $$migrationsPath -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0); if (-not $$hasMigrations) { Write-Host 'No migrations found, creating initial migration...'; Set-Location services\notification-service; npm.cmd run prisma:generate; npx.cmd prisma migrate dev --name init --skip-seed; Set-Location ..\.. } else { Write-Host 'Migrations found, running migrate-notification...'; Set-Location services\notification-service; npm.cmd run prisma:generate; npm.cmd run prisma:migrate:deploy; Set-Location ..\.. }"
else
	@if [ ! -d "services/notification-service/prisma/migrations" ] || [ -z "$$(ls -A services/notification-service/prisma/migrations 2>/dev/null)" ]; then \
		echo "No migrations found, creating initial migration..."; \
		cd services/notification-service && npm run prisma:generate && npx prisma migrate dev --name init --skip-seed || true; \
	else \
		$(MAKE) migrate-notification; \
	fi
endif
	@echo "✅ Notification-service database setup complete"

setup-discount: ## Complete setup for discount-service (migrate)
	@echo "Setting up discount-service database..."
	@echo "Note: Ensure .env file exists with required environment variables"
ifeq ($(DETECTED_OS),Windows)
	@powershell -Command "if (-not (Test-Path 'services\discount-service\.env')) { Write-Host '⚠️  Warning: .env file not found. Please create services\discount-service\.env with required environment variables.' }"
else
	@if [ ! -f services/discount-service/.env ]; then \
		echo "⚠️  Warning: .env file not found. Please create services/discount-service/.env with required environment variables."; \
	fi
endif
	@echo "Creating initial migration if needed..."
ifeq ($(DETECTED_OS),Windows)
	@powershell -Command "$$migrationsPath = 'services\discount-service\prisma\migrations'; $$hasMigrations = (Test-Path $$migrationsPath) -and ((Get-ChildItem $$migrationsPath -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0); if (-not $$hasMigrations) { Write-Host 'No migrations found, creating initial migration...'; Set-Location services\discount-service; npm.cmd run prisma:generate; npx.cmd prisma migrate dev --name init --skip-seed; Set-Location ..\.. } else { Write-Host 'Migrations found, running migrate-discount...'; Set-Location services\discount-service; npm.cmd run prisma:generate; npm.cmd run prisma:migrate:deploy; Set-Location ..\.. }"
else
	@if [ ! -d "services/discount-service/prisma/migrations" ] || [ -z "$$(ls -A services/discount-service/prisma/migrations 2>/dev/null)" ]; then \
		echo "No migrations found, creating initial migration..."; \
		cd services/discount-service && npm run prisma:generate && npx prisma migrate dev --name init --skip-seed || true; \
	else \
		$(MAKE) migrate-discount; \
	fi
endif
	@echo "✅ Discount-service database setup complete"

setup-shipping: ## Complete setup for shipping-service (migrate)
	@echo "Setting up shipping-service database..."
	@echo "Note: Ensure .env file exists with required environment variables"
ifeq ($(DETECTED_OS),Windows)
	@powershell -Command "if (-not (Test-Path 'services\shipping-service\.env')) { Write-Host '⚠️  Warning: .env file not found. Please create services\shipping-service\.env with required environment variables.' }"
else
	@if [ ! -f services/shipping-service/.env ]; then \
		echo "⚠️  Warning: .env file not found. Please create services/shipping-service/.env with required environment variables."; \
	fi
endif
	@echo "Creating initial migration if needed..."
ifeq ($(DETECTED_OS),Windows)
	@powershell -Command "$$migrationsPath = 'services\shipping-service\prisma\migrations'; $$hasMigrations = (Test-Path $$migrationsPath) -and ((Get-ChildItem $$migrationsPath -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0); if (-not $$hasMigrations) { Write-Host 'No migrations found, creating initial migration...'; Set-Location services\shipping-service; npm.cmd run prisma:generate; npx.cmd prisma migrate dev --name init --skip-seed; Set-Location ..\.. } else { Write-Host 'Migrations found, running migrate-shipping...'; Set-Location services\shipping-service; npm.cmd run prisma:generate; npm.cmd run prisma:migrate:deploy; Set-Location ..\.. }"
else
	@if [ ! -d "services/shipping-service/prisma/migrations" ] || [ -z "$$(ls -A services/shipping-service/prisma/migrations 2>/dev/null)" ]; then \
		echo "No migrations found, creating initial migration..."; \
		cd services/shipping-service && npm run prisma:generate && npx prisma migrate dev --name init --skip-seed || true; \
	else \
		$(MAKE) migrate-shipping; \
	fi
endif
	@echo "✅ Shipping-service database setup complete"

setup-return: ## Complete setup for return-service (migrate)
	@echo "Setting up return-service database..."
	@echo "Note: Ensure .env file exists with required environment variables"
ifeq ($(DETECTED_OS),Windows)
	@powershell -Command "if (-not (Test-Path 'services\return-service\.env')) { Write-Host '⚠️  Warning: .env file not found. Please create services\return-service\.env with required environment variables.' }"
else
	@if [ ! -f services/return-service/.env ]; then \
		echo "⚠️  Warning: .env file not found. Please create services/return-service/.env with required environment variables."; \
	fi
endif
	@echo "Creating initial migration if needed..."
ifeq ($(DETECTED_OS),Windows)
	@powershell -Command "$$migrationsPath = 'services\return-service\prisma\migrations'; $$hasMigrations = (Test-Path $$migrationsPath) -and ((Get-ChildItem $$migrationsPath -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0); if (-not $$hasMigrations) { Write-Host 'No migrations found, creating initial migration...'; Set-Location services\return-service; npm.cmd run prisma:generate; npx.cmd prisma migrate dev --name init --skip-seed; Set-Location ..\.. } else { Write-Host 'Migrations found, running migrate-return...'; Set-Location services\return-service; npm.cmd run prisma:generate; npm.cmd run prisma:migrate:deploy; Set-Location ..\.. }"
else
	@if [ ! -d "services/return-service/prisma/migrations" ] || [ -z "$$(ls -A services/return-service/prisma/migrations 2>/dev/null)" ]; then \
		echo "No migrations found, creating initial migration..."; \
		cd services/return-service && npm run prisma:generate && npx prisma migrate dev --name init --skip-seed || true; \
	else \
		$(MAKE) migrate-return; \
	fi
endif
	@echo "✅ Return-service database setup complete"

setup-all: ## Complete setup for all services (migrate + seed)
	@echo "Setting up all service databases..."
	@echo "Note: Each service generates its Prisma client individually during setup"
	@echo "This ensures database migrations work correctly for each service"
	$(MAKE) setup-auth
	$(MAKE) setup-user
	$(MAKE) setup-cart
	$(MAKE) setup-payment
	$(MAKE) setup-notification
	$(MAKE) setup-discount
	$(MAKE) setup-shipping
	$(MAKE) setup-return
	@echo "✅ All service databases setup complete"
	@echo ""
	@echo "💡 Tip: When building services individually (as microservices should be),"
	@echo "   each service will generate its Prisma client before building, avoiding conflicts."
	@echo "   Use 'make build-auth', 'make build-user', etc. for individual service builds."
	@echo "   Individual builds are recommended for microservices architecture."

# Prisma Studio (database GUI)
studio-auth: ## Open Prisma Studio for auth-service
	cd services/auth-service && npm run prisma:studio

studio-user: ## Open Prisma Studio for user-service
	cd services/user-service && npx prisma studio --port 5556

studio-product: ## Open Prisma Studio for product-service (when implemented)
	@echo "⚠️  Product service Prisma Studio not yet implemented"

studio-cart: ## Open Prisma Studio for cart-service
	cd services/cart-service && npx prisma studio --port 5557

studio-notification: ## Open Prisma Studio for notification-service
	cd services/notification-service && npx prisma studio --port 5558

studio-discount: ## Open Prisma Studio for discount-service
	cd services/discount-service && npx prisma studio --port 5559

studio-shipping: ## Open Prisma Studio for shipping-service
	cd services/shipping-service && npx prisma studio --port 5560

studio-return: ## Open Prisma Studio for return-service
	cd services/return-service && npx prisma studio --port 5561

