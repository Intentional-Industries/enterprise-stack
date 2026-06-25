output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs (ALB tier)"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs (ECS tier)"
  value       = aws_subnet.private[*].id
}

output "data_subnet_ids" {
  description = "Data subnet IDs (RDS tier)"
  value       = aws_subnet.data[*].id
}

output "vpc_endpoint_sg_id" {
  description = "Security group ID attached to VPC interface endpoints"
  value       = aws_security_group.vpc_endpoints.id
}
