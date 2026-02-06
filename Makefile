.PHONY: all setup install dev build clean \
        lint lint-fix typecheck format format-check \
        test test-watch test-keyring test-crypto \
        docker-up docker-down \
        accept-m1 accept-m2 \
        help

# Default target
all: install build typecheck

#
# Setup & Installation
#
setup: ## Full project setup (checks node, installs pnpm, builds, typechecks)
	./scripts/bootstrap.sh

install: ## Install dependencies
	pnpm install

#
# Development
#
dev: ## Start dev mode with hot reload across packages
	pnpm dev

build: ## Compile all packages (Turbo-cached)
	pnpm build

clean: ## Clean build artifacts and node_modules
	rm -rf node_modules
	find . -type d -name 'node_modules' -prune -exec rm -rf {} +
	find . -type d -name 'dist' -prune -exec rm -rf {} +
	find . -type d -name '.turbo' -prune -exec rm -rf {} +

#
# Code Quality
#
lint: ## Run ESLint
	pnpm lint

lint-fix: ## Auto-fix lint issues
	pnpm lint:fix

typecheck: ## TypeScript type checking
	pnpm typecheck

format: ## Format code with Prettier
	pnpm format

format-check: ## Check formatting without changes
	pnpm format:check

check: lint typecheck format-check ## Run all code quality checks

#
# Testing
#
test: ## Run all tests
	pnpm test

test-watch: ## Run tests in watch mode
	pnpm test:watch

test-keyring: ## Test keyring package
	pnpm --filter @open-wallet/keyring test

test-crypto: ## Test crypto package
	pnpm --filter @open-wallet/crypto test

test-crypto-watch: ## Test crypto package in watch mode
	pnpm --filter @open-wallet/crypto test:watch

#
# Docker / Local Blockchains
#
docker-up: ## Start local blockchains (Anvil on 8545, Solana on 8899)
	docker-compose -f infra/docker-compose.dev.yml up -d

docker-down: ## Stop local blockchains
	docker-compose -f infra/docker-compose.dev.yml down

#
# Milestone Acceptance Tests
#
accept-m1: ## Run milestone 1 keyring acceptance tests
	./scripts/accept/m1-keyring.sh

accept-m2: ## Run milestone 2 EVM transfer tests (requires Anvil)
	./scripts/accept/m2-evm-local-transfer.sh

#
# Help
#
help: ## Show this help message
	@echo "Open Wallet - Available Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'
