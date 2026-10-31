# ──────────────────────────────────────────────
# AWS Budgets — Cost Guardrails
# Alerts at 50%, 80%, 100% of budget
# ──────────────────────────────────────────────

resource "aws_budgets_budget" "tara_monthly" {
  name         = "tara-monthly-budget"
  budget_type  = "COST"
  limit_amount = tostring(var.budget_amount)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "TagKeyValue"
    values = ["user:project$tara"]
  }

  dynamic "notification" {
    for_each = [50, 80, 100]
    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = notification.value
      threshold_type             = "PERCENTAGE"
      notification_type          = "ACTUAL"
      subscriber_email_addresses = var.budget_alert_emails
    }
  }
}
