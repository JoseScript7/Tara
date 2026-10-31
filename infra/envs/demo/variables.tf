variable "region" {
  type        = string
  default     = "ap-south-1"
  description = "AWS region"
}

variable "env" {
  type        = string
  default     = "demo"
  description = "Environment name"
}

variable "profile" {
  type        = string
  default     = "lean"
  description = "Infrastructure profile: 'lean' (cost-optimized) or 'full' (deck-faithful)"
  validation {
    condition     = contains(["lean", "full"], var.profile)
    error_message = "Profile must be 'lean' or 'full'."
  }
}

variable "bedrock_model_id" {
  type        = string
  default     = ""
  description = "Bedrock model ID. Verify availability in your region. Do not assume."
}

variable "bedrock_embedding_model_id" {
  type        = string
  default     = ""
  description = "Bedrock embedding model ID for vector generation."
}

variable "sarvam_api_endpoint" {
  type        = string
  default     = ""
  description = "Sarvam AI API endpoint. Check current docs for hostname."
}

variable "domain_name" {
  type        = string
  default     = ""
  description = "Custom domain name (optional). If empty, uses CloudFront domain."
}
