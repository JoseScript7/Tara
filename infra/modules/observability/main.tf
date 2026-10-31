# ──────────────────────────────────────────────
# Tara — Observability Module
# CloudWatch Dashboards, Alarms, Log Groups
# ──────────────────────────────────────────────

variable "env" {
  type = string
}

variable "ecs_cluster_name" {
  type    = string
  default = ""
}

variable "alb_arn_suffix" {
  type    = string
  default = ""
}

# ─── CloudWatch Dashboard ───────────────────

resource "aws_cloudwatch_dashboard" "tara" {
  dashboard_name = "tara-${var.env}-overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "API Errors (5xx)"
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", var.alb_arn_suffix]
          ]
          period = 300
          stat   = "Sum"
          region = "ap-south-1"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "ECS CPU Utilization"
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name]
          ]
          period = 300
          stat   = "Average"
          region = "ap-south-1"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "SQS Queue Depth"
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", "tara-${var.env}-signals"],
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", "tara-${var.env}-agent-decisions"]
          ]
          period = 300
          stat   = "Average"
          region = "ap-south-1"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "Bedrock Invocations"
          metrics = [
            ["AWS/Bedrock", "Invocations"],
            ["AWS/Bedrock", "InvocationLatency"]
          ]
          period = 300
          stat   = "Sum"
          region = "ap-south-1"
        }
      }
    ]
  })
}

# ─── Alarms ──────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "tara-${var.env}-api-5xx-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "API 5xx errors above threshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = {
    Name = "tara-${var.env}-api-5xx-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name          = "tara-${var.env}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ECS CPU utilization above 85%"

  dimensions = {
    ClusterName = var.ecs_cluster_name
  }

  tags = {
    Name = "tara-${var.env}-ecs-cpu-alarm"
  }
}

# ─── Application Log Groups ─────────────────

resource "aws_cloudwatch_log_group" "agent_decisions" {
  name              = "/tara/${var.env}/agent-decisions"
  retention_in_days = 30

  tags = {
    Name    = "tara-${var.env}-agent-decisions-logs"
    Purpose = "Agent decision audit trail"
  }
}

resource "aws_cloudwatch_log_group" "corebank_calls" {
  name              = "/tara/${var.env}/corebank-calls"
  retention_in_days = 30

  tags = {
    Name    = "tara-${var.env}-corebank-calls-logs"
    Purpose = "Core Mock API call log"
  }
}

# ─── Outputs ─────────────────────────────────

output "dashboard_name" {
  value = aws_cloudwatch_dashboard.tara.dashboard_name
}
