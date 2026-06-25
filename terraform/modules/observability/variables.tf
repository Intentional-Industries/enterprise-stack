variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "kms_key_arn" {
  description = "KMS CMK ARN for encryption"
  type        = string
}

variable "kms_key_id" {
  description = "KMS CMK key ID"
  type        = string
}

variable "account_id" {
  description = "AWS account ID"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "owner" {
  type    = string
  default = "platform"
}

variable "data_classification" {
  type    = string
  default = "internal"
}

variable "app_log_retention_days" {
  description = "CloudWatch log retention for app logs (days)"
  type        = number
  default     = 30
}

variable "alb_log_retention_days" {
  description = "CloudWatch log retention for ALB logs (days)"
  type        = number
  default     = 7
}

variable "audit_retention_years" {
  description = "Object Lock retention period in years for audit logs"
  type        = number
  default     = 7
}
