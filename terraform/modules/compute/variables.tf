variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "alb_sg_id" {
  type = string
}

variable "ecs_sg_id" {
  type = string
}

variable "kms_key_arn" {
  type = string
}

variable "app_log_group_name" {
  type = string
}

variable "ecr_repository_url" {
  type = string
}

variable "app_image" {
  description = "Full ECR image URI including tag"
  type        = string
}

variable "ecs_cpu" {
  type    = number
  default = 512
}

variable "ecs_memory" {
  type    = number
  default = 1024
}

variable "ecs_desired_count" {
  type    = number
  default = 2
}

variable "db_secret_arn" {
  description = "ARN of the RDS master user secret in Secrets Manager"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "intentional"
}

variable "cognito_user_pool_id" {
  type = string
}

variable "cognito_client_id" {
  type = string
}

variable "cloudfront_secret" {
  description = "Secret value expected in X-CloudFront-Secret header"
  type        = string
  sensitive   = true
}

variable "account_id" {
  type = string
}

variable "user_pool_arn" {
  description = "Cognito User Pool ARN"
  type        = string
}

variable "session_secret_arn" {
  description = "ARN of the session JWT signing secret in Secrets Manager"
  type        = string
}

variable "db_host" {
  description = "RDS instance endpoint hostname"
  type        = string
}

variable "db_port" {
  description = "RDS instance port"
  type        = number
  default     = 5432
}
