variable "project" {
  description = "Project name used as a prefix for all resources"
  type        = string
  default     = "intentional"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "owner" {
  description = "Owner tag applied to all resources"
  type        = string
  default     = "platform"
}

variable "data_classification" {
  description = "Data classification tag applied to all resources"
  type        = string
  default     = "internal"
}

variable "ecs_cpu" {
  description = "CPU units for the ECS task (1 vCPU = 1024)"
  type        = number
  default     = 512
}

variable "ecs_memory" {
  description = "Memory in MiB for the ECS task"
  type        = number
  default     = 1024
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "app_image" {
  description = "Full ECR image URI including tag (e.g. 123456789.dkr.ecr.us-east-1.amazonaws.com/intentional/dev/app:latest)"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB for RDS"
  type        = number
  default     = 20
}
