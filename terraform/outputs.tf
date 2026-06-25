output "cloudfront_domain" {
  description = "CloudFront distribution domain name (the app URL)"
  value       = module.edge.cloudfront_domain
}

output "ecr_repository_url" {
  description = "ECR repository URL for pushing app images"
  value       = module.observability.ecr_repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.compute.ecs_cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.compute.ecs_service_name
}

output "migration_task_definition_arn" {
  description = "ARN of the ECS task definition for DB migrations"
  value       = module.compute.migration_task_definition_arn
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.identity.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.identity.user_pool_client_id
}

output "db_secret_arn" {
  description = "ARN of the Secrets Manager secret containing DB credentials"
  value       = module.data.db_secret_arn
  sensitive   = true
}

output "alb_dns_name" {
  description = "ALB DNS name (do not use directly; access via CloudFront)"
  value       = module.compute.alb_dns_name
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.network.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs (ECS)"
  value       = module.network.private_subnet_ids
}

output "task_role_arn" {
  description = "ECS task IAM role ARN (used by migration runner)"
  value       = module.compute.task_role_arn
}

output "ecs_sg_id" {
  description = "ECS tasks security group ID"
  value       = module.security.ecs_sg_id
}
