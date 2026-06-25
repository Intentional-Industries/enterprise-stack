output "app_log_group_name" {
  description = "CloudWatch log group name for app logs"
  value       = aws_cloudwatch_log_group.app.name
}

output "alb_log_group_name" {
  description = "CloudWatch log group name for ALB logs"
  value       = aws_cloudwatch_log_group.alb.name
}

output "audit_bucket_arn" {
  description = "ARN of the audit S3 bucket (Object Lock, COMPLIANCE)"
  value       = aws_s3_bucket.audit.arn
}

output "audit_bucket_id" {
  description = "Name of the audit S3 bucket"
  value       = aws_s3_bucket.audit.id
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_repository_name" {
  description = "ECR repository name"
  value       = aws_ecr_repository.app.name
}

output "config_bucket_id" {
  description = "AWS Config S3 delivery bucket name"
  value       = aws_s3_bucket.config.id
}
