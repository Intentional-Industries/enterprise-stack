output "db_endpoint" {
  description = "RDS endpoint hostname"
  value       = aws_db_instance.main.address
}

output "db_port" {
  description = "RDS port"
  value       = aws_db_instance.main.port
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "db_secret_arn" {
  description = "ARN of the Secrets Manager secret containing RDS master credentials"
  value       = aws_db_instance.main.master_user_secret[0].secret_arn
  sensitive   = true
}

output "db_instance_id" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.identifier
}

output "external_services_secret_arn" {
  description = "ARN of the empty V2 external-services secret"
  value       = aws_secretsmanager_secret.external_services.arn
}

output "session_secret_arn" {
  description = "ARN of the session JWT signing secret"
  value       = aws_secretsmanager_secret.session_secret.arn
  sensitive   = true
}
