# ──────────────────────────────────────────────
# Tara — Streaming Module
# SQS + EventBridge (lean) or MSK (full)
# ──────────────────────────────────────────────

variable "env" {
  type = string
}

variable "use_msk" {
  type    = bool
  default = false
}

variable "vpc_id" {
  type    = string
  default = ""
}

variable "private_subnet_ids" {
  type    = list(string)
  default = []
}

variable "kms_streams_key_arn" {
  type    = string
  default = ""
}

# ─── Lean Profile: SQS Queues ───────────────

locals {
  topics = ["transactions", "telemetry", "tickets", "signals", "agent-decisions"]
}

resource "aws_sqs_queue" "main" {
  for_each = var.use_msk ? toset([]) : toset(local.topics)

  name                       = "tara-${var.env}-${each.key}"
  visibility_timeout_seconds = 60
  message_retention_seconds  = 86400 # 1 day
  receive_wait_time_seconds  = 10    # Long polling
  kms_master_key_id          = var.kms_streams_key_arn != "" ? var.kms_streams_key_arn : null

  tags = {
    Name  = "tara-${var.env}-${each.key}"
    Topic = each.key
  }
}

# Dead-letter queues
resource "aws_sqs_queue" "dlq" {
  for_each = var.use_msk ? toset([]) : toset(local.topics)

  name                      = "tara-${var.env}-${each.key}-dlq"
  message_retention_seconds = 604800 # 7 days
  kms_master_key_id         = var.kms_streams_key_arn != "" ? var.kms_streams_key_arn : null

  tags = {
    Name  = "tara-${var.env}-${each.key}-dlq"
    Topic = each.key
  }
}

resource "aws_sqs_queue_redrive_policy" "main" {
  for_each = var.use_msk ? {} : aws_sqs_queue.main

  queue_url = each.value.id
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq[each.key].arn
    maxReceiveCount     = 3
  })
}

# ─── Lean Profile: EventBridge ───────────────

resource "aws_cloudwatch_event_bus" "tara" {
  count = var.use_msk ? 0 : 1
  name  = "tara-${var.env}-events"

  tags = {
    Name = "tara-${var.env}-event-bus"
  }
}

# ─── Outputs ─────────────────────────────────

output "queue_urls" {
  value = { for k, v in aws_sqs_queue.main : k => v.url }
}

output "queue_arns" {
  value = { for k, v in aws_sqs_queue.main : k => v.arn }
}

output "dlq_urls" {
  value = { for k, v in aws_sqs_queue.dlq : k => v.url }
}

output "event_bus_name" {
  value = var.use_msk ? "" : (length(aws_cloudwatch_event_bus.tara) > 0 ? aws_cloudwatch_event_bus.tara[0].name : "")
}
