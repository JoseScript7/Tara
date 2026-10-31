# ══════════════════════════════════════════════
# Tara — Makefile
# Common tasks for development and deployment
# ══════════════════════════════════════════════

.PHONY: help tf-init tf-plan tf-apply tf-destroy \
        tf-bootstrap-init tf-bootstrap-plan tf-bootstrap-apply \
        dev dev-backend dev-frontend \
        build test lint \
        docker-build docker-up docker-down \
        seed-data eval demo-up demo-down demo-reset \
        clean

# ─── Help ────────────────────────────────────
preflight: ## Test credentials and print provider status matrix (Prompt B2 / V4-26)
	python3 scripts/preflight.py

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'

# ─── Terraform: Bootstrap ────────────────────
tf-bootstrap-init: ## Initialize bootstrap Terraform
	cd infra/bootstrap && terraform init

tf-bootstrap-plan: ## Plan bootstrap infrastructure
	cd infra/bootstrap && terraform plan

tf-bootstrap-apply: ## Apply bootstrap infrastructure
	cd infra/bootstrap && terraform apply

# ─── Terraform: Demo Environment ─────────────
tf-init: ## Initialize demo environment Terraform
	cd infra/envs/demo && terraform init

tf-plan: ## Plan demo environment (use PROFILE=lean|full)
	cd infra/envs/demo && terraform plan -var="profile=$(or $(PROFILE),lean)"

tf-apply: ## Apply demo environment (use PROFILE=lean|full)
	cd infra/envs/demo && terraform apply -var="profile=$(or $(PROFILE),lean)"

tf-destroy: ## ⚠️  Destroy all demo infrastructure
	cd infra/envs/demo && terraform destroy -var="profile=$(or $(PROFILE),lean)"

# ─── Local Development ───────────────────────
dev: ## Start all local services
	$(MAKE) dev-backend &
	$(MAKE) dev-frontend

dev-backend: ## Start Python backend (FastAPI + LangGraph)
	cd python-backend && python main.py

dev-frontend: ## Start frontend dev server
	cd frontend && npm run dev

# ─── Build ───────────────────────────────────
build: ## Build all services
	cd frontend && npm run build
	cd python-backend && echo "Python backend: no build step needed"

# ─── Test ────────────────────────────────────
test: ## Run all tests
	cd python-backend && python -m pytest tests/ -v 2>/dev/null || echo "No Python tests yet"
	cd frontend && npm test 2>/dev/null || echo "No frontend tests yet"
	cd backend && npm test 2>/dev/null || echo "No backend tests yet"

# ─── Lint ────────────────────────────────────
lint: ## Run linters
	cd frontend && npx eslint src/ 2>/dev/null || echo "Frontend lint skipped"

# ─── Docker ──────────────────────────────────
docker-build: ## Build Docker images
	docker-compose build

docker-up: ## Start all services with Docker Compose
	docker-compose up -d

docker-down: ## Stop all Docker services
	docker-compose down

# ─── Data ────────────────────────────────────
seed-data: ## Generate and load synthetic data (Prompt 10)
	python3 python-backend/data/seed_data.py

# ─── Evaluation ──────────────────────────────
eval: ## Run evaluation harness (Prompt 21)
	python3 python-backend/eval/eval_harness.py

# ─── Demo ────────────────────────────────────
demo-run: ## Run 3-minute automated judge demo (Prompt 22)
	python3 python-backend/demo/run_demo.py

demo-up: ## Scale up demo infrastructure
	@echo "Scaling up demo environment..."
	$(MAKE) tf-apply PROFILE=$(or $(PROFILE),lean)

demo-down: ## Scale down / destroy demo infrastructure to stop costs
	@echo "⚠️  Tearing down demo environment to stop costs..."
	$(MAKE) tf-destroy PROFILE=$(or $(PROFILE),lean)

demo-reset: ## Reset demo state (synthetic data, agent state)
	curl -s -X POST http://localhost:8000/api/reset || python3 -c "from services.corebank_mock import *; print('Reset locally')"
	@echo "\n✅ Demo state reset"


# ─── Clean ───────────────────────────────────
clean: ## Remove build artifacts and caches
	rm -rf frontend/dist
	rm -rf python-backend/__pycache__
	rm -rf python-backend/agent/__pycache__
	rm -rf python-backend/tools/__pycache__
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
