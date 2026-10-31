# ──────────────────────────────────────────────
# Tara — Terraform Bootstrap
# One-time setup: S3 state bucket, DynamoDB lock,
# OIDC provider, budgets
# ──────────────────────────────────────────────

terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      project = "tara"
      env     = "bootstrap"
    }
  }
}
