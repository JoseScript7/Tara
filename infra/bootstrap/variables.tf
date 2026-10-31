variable "region" {
  type        = string
  default     = "ap-south-1"
  description = "AWS region for all Tara resources"
}

variable "account_id" {
  type        = string
  description = "AWS account ID (used in S3 bucket naming)"
}

variable "github_org" {
  type        = string
  default     = "Cyber-Phantoms"
  description = "GitHub organization or username for OIDC"
}

variable "github_repo" {
  type        = string
  default     = "tara-merchant-teammate"
  description = "GitHub repository name for OIDC"
}

variable "budget_amount" {
  type        = number
  default     = 50
  description = "Monthly budget limit in USD"
}

variable "budget_alert_emails" {
  type        = list(string)
  default     = []
  description = "Email addresses for budget alerts"
}
