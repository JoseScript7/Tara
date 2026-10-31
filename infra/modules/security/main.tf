# ──────────────────────────────────────────────
# Tara — Security Module
# KMS, WAF, GuardDuty, Config, CloudTrail
# ──────────────────────────────────────────────

variable "env" {
  type = string
}

variable "region" {
  type    = string
  default = "ap-south-1"
}

variable "vpc_id" {
  type        = string
  default     = ""
  description = "VPC ID (passed from network module)"
}

data "aws_caller_identity" "current" {}

# ─── KMS Keys ────────────────────────────────

resource "aws_kms_key" "data" {
  description             = "Tara ${var.env} - data encryption (DBs, S3)"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name    = "tara-${var.env}-data-key"
    Purpose = "Database and S3 encryption"
  }
}

resource "aws_kms_alias" "data" {
  name          = "alias/tara-${var.env}-data"
  target_key_id = aws_kms_key.data.key_id
}

resource "aws_kms_key" "logs" {
  description             = "Tara ${var.env} - log encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableRootAccount"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowCloudTrail"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowCloudWatchLogs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:Describe*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name    = "tara-${var.env}-logs-key"
    Purpose = "Log and audit encryption"
  }
}

resource "aws_kms_alias" "logs" {
  name          = "alias/tara-${var.env}-logs"
  target_key_id = aws_kms_key.logs.key_id
}

resource "aws_kms_key" "streams" {
  description             = "Tara ${var.env} - streaming encryption (MSK/SQS)"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name    = "tara-${var.env}-streams-key"
    Purpose = "Event stream encryption"
  }
}

resource "aws_kms_alias" "streams" {
  name          = "alias/tara-${var.env}-streams"
  target_key_id = aws_kms_key.streams.key_id
}

# ─── WAF Web ACL ─────────────────────────────

resource "aws_wafv2_web_acl" "main" {
  name        = "tara-${var.env}-waf"
  scope       = "CLOUDFRONT"
  description = "Tara WAF - managed rules + rate limiting"

  # NOTE: CLOUDFRONT scope WAF must be in us-east-1.
  # If this causes issues, create a separate provider for us-east-1
  # or change scope to REGIONAL for ALB-only protection.

  default_action {
    allow {}
  }

  # AWS Managed Rule: Common Rule Set
  rule {
    name     = "aws-managed-common"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "tara-waf-common"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rule: Known Bad Inputs
  rule {
    name     = "aws-managed-bad-inputs"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "tara-waf-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  # Rate Limiting
  rule {
    name     = "rate-limit"
    priority = 3

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "tara-waf-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "tara-waf-main"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "tara-${var.env}-waf"
  }
}

# ─── CloudTrail ──────────────────────────────

resource "aws_s3_bucket" "cloudtrail" {
  bucket = "tara-${var.env}-cloudtrail-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name    = "tara-${var.env}-cloudtrail"
    Purpose = "Audit logging"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.logs.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket                  = aws_s3_bucket.cloudtrail.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

resource "aws_cloudtrail" "main" {
  name                          = "tara-${var.env}-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = false
  enable_logging                = true
  kms_key_id                    = aws_kms_key.logs.arn

  tags = {
    Name = "tara-${var.env}-trail"
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# ─── GuardDuty ───────────────────────────────

resource "aws_guardduty_detector" "main" {
  enable = true

  tags = {
    Name = "tara-${var.env}-guardduty"
  }
}

# ─── Outputs ─────────────────────────────────

output "kms_data_key_arn" {
  value = aws_kms_key.data.arn
}

output "kms_logs_key_arn" {
  value = aws_kms_key.logs.arn
}

output "kms_streams_key_arn" {
  value = aws_kms_key.streams.arn
}

output "waf_acl_arn" {
  value = aws_wafv2_web_acl.main.arn
}

output "cloudtrail_name" {
  value = aws_cloudtrail.main.name
}

output "guardduty_detector_id" {
  value = aws_guardduty_detector.main.id
}
