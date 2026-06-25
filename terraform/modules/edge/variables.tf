variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "alb_dns_name" {
  description = "ALB DNS name used as CloudFront origin"
  type        = string
}

variable "cloudfront_secret" {
  description = "Secret injected into X-CloudFront-Secret header so ALB rejects direct access"
  type        = string
  sensitive   = true
}

variable "alb_listener_arn" {
  description = "ARN of the ALB HTTP listener (used for output reference, not attachment — WAF attaches to CF)"
  type        = string
}

variable "logging_bucket_id" {
  description = "S3 bucket name for CloudFront access logs"
  type        = string
}

variable "aws_region" {
  description = "AWS region (must be us-east-1 for CloudFront WAF)"
  type        = string
  default     = "us-east-1"
}
