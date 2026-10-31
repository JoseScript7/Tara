# ──────────────────────────────────────────────
# Tara — Demo Environment
# ──────────────────────────────────────────────

terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket         = "tara-tfstate-REPLACE_ACCOUNT_ID"
    key            = "envs/demo/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "tara-tflock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      project = "tara"
      env     = var.env
    }
  }
}

# ──────────────────────────────────────────────
# Profile Toggle
# ──────────────────────────────────────────────

locals {
  use_msk        = var.profile == "full"
  use_neptune    = var.profile == "full"
  use_opensearch = var.profile == "full"
}

# ──────────────────────────────────────────────
# Modules (uncomment as they are built)
# ──────────────────────────────────────────────

# module "network" {
#   source  = "../../modules/network"
#   env     = var.env
#   region  = var.region
#   profile = var.profile
# }

# module "security" {
#   source  = "../../modules/security"
#   env     = var.env
#   region  = var.region
# }

# module "data" {
#   source       = "../../modules/data"
#   env          = var.env
#   profile      = var.profile
#   vpc_id       = module.network.vpc_id
#   private_subnet_ids = module.network.private_subnet_ids
# }

# module "streaming" {
#   source  = "../../modules/streaming"
#   env     = var.env
#   use_msk = local.use_msk
#   vpc_id  = module.network.vpc_id
#   private_subnet_ids = module.network.private_subnet_ids
# }

# module "compute" {
#   source  = "../../modules/compute"
#   env     = var.env
#   vpc_id  = module.network.vpc_id
#   private_subnet_ids = module.network.private_subnet_ids
#   public_subnet_ids  = module.network.public_subnet_ids
# }

# module "ai" {
#   source  = "../../modules/ai"
#   env     = var.env
#   region  = var.region
#   bedrock_model_id = var.bedrock_model_id
# }

# module "edge" {
#   source  = "../../modules/edge"
#   env     = var.env
#   alb_dns = module.compute.alb_dns
# }

# module "corebank_mock" {
#   source  = "../../modules/corebank_mock"
#   env     = var.env
#   region  = var.region
# }

# module "observability" {
#   source  = "../../modules/observability"
#   env     = var.env
# }
