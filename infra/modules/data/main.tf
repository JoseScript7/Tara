# ──────────────────────────────────────────────
# Tara — Data Module
# Aurora PostgreSQL, pgvector, Neptune (full), 
# OpenSearch (full), S3 buckets, Secrets Manager
# ──────────────────────────────────────────────

variable "env" {
  type = string
}

variable "profile" {
  type    = string
  default = "lean"
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "kms_data_key_arn" {
  type    = string
  default = ""
}

variable "allowed_security_group_ids" {
  type    = list(string)
  default = []
}

locals {
  use_neptune    = var.profile == "full"
  use_opensearch = var.profile == "full"
}

data "aws_caller_identity" "current" {}

# ─── DB Subnet Group ────────────────────────

resource "aws_db_subnet_group" "main" {
  name       = "tara-${var.env}-db"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "tara-${var.env}-db-subnet-group"
  }
}

# ─── Security Group for Aurora ───────────────

resource "aws_security_group" "aurora" {
  name_prefix = "tara-${var.env}-aurora-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
    description     = "PostgreSQL from app tasks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "tara-${var.env}-aurora-sg"
  }
}

# ─── Aurora PostgreSQL ───────────────────────

resource "aws_rds_cluster" "main" {
  cluster_identifier     = "tara-${var.env}"
  engine                 = "aurora-postgresql"
  engine_version         = "15.4" # Verify current version supporting pgvector
  database_name          = "tara"
  master_username        = "tara_admin"
  manage_master_user_password = true # AWS manages the password in Secrets Manager
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.aurora.id]
  storage_encrypted      = true
  kms_key_id             = var.kms_data_key_arn != "" ? var.kms_data_key_arn : null
  skip_final_snapshot    = true # Demo only; set false for production
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"

  tags = {
    Name = "tara-${var.env}-aurora"
  }
}

resource "aws_rds_cluster_instance" "main" {
  count              = 1 # Single instance for demo
  identifier         = "tara-${var.env}-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.t3.medium" # Verify smallest available class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  tags = {
    Name = "tara-${var.env}-aurora-instance-${count.index}"
  }
}

# ─── S3: Decision Log Bucket (Object Lock) ──

resource "aws_s3_bucket" "decision_logs" {
  bucket = "tara-${var.env}-decision-logs-${data.aws_caller_identity.current.account_id}"

  object_lock_enabled = true

  tags = {
    Name    = "tara-${var.env}-decision-logs"
    Purpose = "Immutable audit trail for agent decisions"
  }
}

resource "aws_s3_bucket_object_lock_configuration" "decision_logs" {
  bucket = aws_s3_bucket.decision_logs.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = 90
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "decision_logs" {
  bucket = aws_s3_bucket.decision_logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_data_key_arn != "" ? var.kms_data_key_arn : null
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "decision_logs" {
  bucket                  = aws_s3_bucket.decision_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ─── S3: Artifacts Bucket (photos, voice) ────

resource "aws_s3_bucket" "artifacts" {
  bucket = "tara-${var.env}-artifacts-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name    = "tara-${var.env}-artifacts"
    Purpose = "Merchant uploads (photos, voice notes)"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_data_key_arn != "" ? var.kms_data_key_arn : null
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket                  = aws_s3_bucket.artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    id     = "expire-old-uploads"
    status = "Enabled"

    expiration {
      days = 90
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST"]
    allowed_origins = ["*"] # Restrict to actual domain in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ─── Outputs ─────────────────────────────────

output "aurora_cluster_endpoint" {
  value = aws_rds_cluster.main.endpoint
}

output "aurora_cluster_reader_endpoint" {
  value = aws_rds_cluster.main.reader_endpoint
}

output "aurora_cluster_id" {
  value = aws_rds_cluster.main.id
}

output "aurora_sg_id" {
  value = aws_security_group.aurora.id
}

output "decision_logs_bucket" {
  value = aws_s3_bucket.decision_logs.id
}

output "artifacts_bucket" {
  value = aws_s3_bucket.artifacts.id
}
