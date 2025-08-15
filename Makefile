# Turnkey Admin Dashboard Makefile
# Provides commands for multi-environment development

.PHONY: help dev-local dev-dev dev-preprod dev-prod build test lint type-check clean install

# Default target
help:
	@echo "Turnkey Admin Dashboard - Available Commands:"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev-local    - Start development server with local environment"
	@echo "  make dev-dev      - Start development server with dev environment"
	@echo "  make dev-preprod  - Start development server with preprod environment" 
	@echo "  make dev-prod     - Start development server with prod environment"
	@echo ""
	@echo "Build Commands:"
	@echo "  make build        - Build the application for production"
	@echo "  make start        - Start the production server"
	@echo ""
	@echo "Quality Commands:"
	@echo "  make test         - Run tests"
	@echo "  make lint         - Run ESLint"
	@echo "  make type-check   - Run TypeScript type checking"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make install      - Install dependencies"
	@echo "  make clean        - Clean build artifacts"

# Development commands with environment-specific configurations
dev-local:
	@echo "🚀 Starting development server with LOCAL environment..."
	@if [ ! -f config/local.env ]; then echo "❌ config/local.env not found"; exit 1; fi
	@cp config/local.env .env.local
	@echo "✅ Copied config/local.env to .env.local"
	@npm run dev

dev-dev:
	@echo "🚀 Starting development server with DEV environment..."
	@if [ ! -f config/dev.env ]; then echo "❌ config/dev.env not found"; exit 1; fi
	@cp config/dev.env .env.local
	@echo "✅ Copied config/dev.env to .env.local"
	@npm run dev

dev-preprod:
	@echo "🚀 Starting development server with PREPROD environment..."
	@if [ ! -f config/preprod.env ]; then echo "❌ config/preprod.env not found"; exit 1; fi
	@cp config/preprod.env .env.local
	@echo "✅ Copied config/preprod.env to .env.local"
	@npm run dev

dev-prod:
	@echo "🚀 Starting development server with PROD environment..."
	@if [ ! -f config/prod.env ]; then echo "❌ config/prod.env not found"; exit 1; fi
	@cp config/prod.env .env.local
	@echo "✅ Copied config/prod.env to .env.local"
	@npm run dev

# Build commands
build:
	@echo "🔨 Building application..."
	@npm run build

start:
	@echo "▶️  Starting production server..."
	@npm run start

# Quality commands
test:
	@echo "🧪 Running tests..."
	@npm run test

lint:
	@echo "🔍 Running ESLint..."
	@npm run lint

type-check:
	@echo "📝 Running TypeScript type checking..."
	@npm run type-check

# Utility commands  
install:
	@echo "📦 Installing dependencies..."
	@npm install

clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf .next
	@rm -rf out
	@rm -rf node_modules/.cache
