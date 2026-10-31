output "state_bucket" {
  value       = aws_s3_bucket.tfstate.id
  description = "S3 bucket for Terraform state"
}

output "lock_table" {
  value       = aws_dynamodb_table.tflock.name
  description = "DynamoDB table for Terraform state locking"
}

output "github_deploy_role_arn" {
  value       = aws_iam_role.github_deploy.arn
  description = "IAM role ARN for GitHub Actions OIDC"
}

output "github_oidc_provider_arn" {
  value       = aws_iam_openid_connect_provider.github.arn
  description = "GitHub OIDC provider ARN"
}
