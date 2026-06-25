output "alb_dns_name" {
  description = "ALB DNS name (used as CloudFront origin)"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_listener_arn" {
  description = "ARN of the HTTP:80 ALB listener"
  value       = aws_lb_listener.http.arn
}

output "alb_target_group_arn" {
  description = "ARN of the ALB target group"
  value       = aws_lb_target_group.app.arn
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.app.name
}

output "ecs_task_definition_arn" {
  description = "ARN of the app ECS task definition"
  value       = aws_ecs_task_definition.app.arn
}

output "migration_task_definition_arn" {
  description = "ARN of the migration ECS task definition"
  value       = aws_ecs_task_definition.migration.arn
}

output "task_role_arn" {
  description = "ECS task IAM role ARN"
  value       = aws_iam_role.task.arn
}

output "execution_role_arn" {
  description = "ECS task execution IAM role ARN"
  value       = aws_iam_role.execution.arn
}
