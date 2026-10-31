# ──────────────────────────────────────────────
# Tara — AI Module
# Bedrock Guardrail, IAM for model access
# ──────────────────────────────────────────────

variable "env" {
  type = string
}

variable "region" {
  type    = string
  default = "ap-south-1"
}

variable "bedrock_model_id" {
  type        = string
  description = "Bedrock model ID — verify in console before setting"
}

# ─── Bedrock Guardrail ───────────────────────
# NOTE: Verify aws_bedrock_guardrail resource name and arguments
# in the current Terraform AWS provider docs. This resource may
# be named differently or have different arguments.

resource "aws_bedrock_guardrail" "tara" {
  name                      = "tara-${var.env}-guardrail"
  description               = "Tara agent guardrail - PII filtering, topic blocking"
  blocked_input_messaging   = "I cannot process that request. Please rephrase without sensitive information."
  blocked_outputs_messaging = "I cannot provide that information. Let me help you differently."

  # PII filtering
  sensitive_information_policy_config {
    pii_entities_config {
      type   = "EMAIL"
      action = "ANONYMIZE"
    }
    pii_entities_config {
      type   = "PHONE"
      action = "ANONYMIZE"
    }
    pii_entities_config {
      type   = "NAME"
      action = "ANONYMIZE"
    }
    pii_entities_config {
      type   = "CREDIT_DEBIT_CARD_NUMBER"
      action = "BLOCK"
    }
  }

  # Content filtering
  content_policy_config {
    filters_config {
      type            = "SEXUAL"
      input_strength  = "HIGH"
      output_strength = "HIGH"
    }
    filters_config {
      type            = "VIOLENCE"
      input_strength  = "HIGH"
      output_strength = "HIGH"
    }
    filters_config {
      type            = "HATE"
      input_strength  = "HIGH"
      output_strength = "HIGH"
    }
    filters_config {
      type            = "INSULTS"
      input_strength  = "HIGH"
      output_strength = "HIGH"
    }
    filters_config {
      type            = "MISCONDUCT"
      input_strength  = "HIGH"
      output_strength = "HIGH"
    }
    filters_config {
      type            = "PROMPT_ATTACK"
      input_strength  = "HIGH"
      output_strength = "NONE"
    }
  }

  # Topic blocking
  topic_policy_config {
    topics_config {
      name       = "off-topic"
      definition = "Requests not related to merchant payments, settlements, devices, disputes, or Paytm merchant services"
      type       = "DENY"
      examples   = ["Tell me a joke", "What is the weather", "Write me a poem"]
    }
  }

  tags = {
    Name = "tara-${var.env}-guardrail"
  }
}

# ─── Outputs ─────────────────────────────────

output "guardrail_id" {
  value = aws_bedrock_guardrail.tara.guardrail_id
}

output "guardrail_arn" {
  value = aws_bedrock_guardrail.tara.guardrail_arn
}
