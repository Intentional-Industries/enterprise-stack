output "kms_key_arn" {
  description = "ARN of the KMS CMK"
  value       = aws_kms_key.main.arn
}

output "kms_key_id" {
  description = "ID of the KMS CMK"
  value       = aws_kms_key.main.key_id
}

output "alb_sg_id" {
  description = "Security group ID for the ALB"
  value       = aws_security_group.alb.id
}

output "ecs_sg_id" {
  description = "Security group ID for ECS tasks"
  value       = aws_security_group.ecs.id
}

output "rds_sg_id" {
  description = "Security group ID for RDS"
  value       = aws_security_group.rds.id
}
