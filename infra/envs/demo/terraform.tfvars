# ──────────────────────────────────────────────
# Demo Environment — Terraform Variables
# Copy this to terraform.tfvars and fill in values
# ──────────────────────────────────────────────

region  = "ap-south-1"
env     = "demo"
profile = "lean" # "lean" or "full"

# VERIFY these against Bedrock console before deploying
# bedrock_model_id           = "anthropic.claude-3-5-sonnet-20241022-v2:0"
# bedrock_embedding_model_id = "amazon.titan-embed-text-v2:0"

# VERIFY against current Sarvam docs
# sarvam_api_endpoint = "https://api.sarvam.ai"

# Optional: custom domain
# domain_name = "tara.yourdomain.com"
