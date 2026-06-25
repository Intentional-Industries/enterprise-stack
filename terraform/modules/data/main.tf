locals {
  name = "${var.project}-${var.environment}"
}

# DB subnet group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name}-db-subnet-group"
  subnet_ids = var.data_subnet_ids

  tags = {
    Name               = "${local.name}-db-subnet-group"
    Owner              = var.owner
    DataClassification = var.data_classification
  }
}

# PostgreSQL 16 parameter group
resource "aws_db_parameter_group" "main" {
  name   = "${local.name}-pg16"
  family = "postgres16"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = { Name = "${local.name}-pg16-params" }
}

# RDS PostgreSQL 16 — Multi-AZ, CMK-encrypted, RDS-managed master password
resource "aws_db_instance" "main" {
  identifier = "${local.name}-postgres"

  engine               = "postgres"
  engine_version       = "16"
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  storage_type         = "gp3"
  storage_encrypted    = true
  kms_key_id           = var.kms_key_arn

  db_name  = "intentional"
  username = "intentional_admin"

  manage_master_user_password   = true
  master_user_secret_kms_key_id = var.kms_key_arn

  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.rds_sg_id]
  parameter_group_name   = aws_db_parameter_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  auto_minor_version_upgrade = true
  deletion_protection        = false
  skip_final_snapshot        = true

  performance_insights_enabled          = true
  performance_insights_kms_key_id       = var.kms_key_arn
  performance_insights_retention_period = 7

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name               = "${local.name}-postgres"
    Owner              = var.owner
    DataClassification = var.data_classification
  }
}

# Session JWT signing secret
resource "random_password" "session_secret" {
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret" "session_secret" {
  name        = "${var.project}/${var.environment}/session-secret"
  kms_key_id  = var.kms_key_arn
  description = "JWT signing secret for user sessions"

  tags = {
    Name               = "${local.name}-session-secret"
    Owner              = var.owner
    DataClassification = var.data_classification
  }
}

resource "aws_secretsmanager_secret_version" "session_secret" {
  secret_id     = aws_secretsmanager_secret.session_secret.id
  secret_string = random_password.session_secret.result
}

# Empty V2 external-services secret — populated by hand before running V2
resource "aws_secretsmanager_secret" "external_services" {
  name       = "${var.project}/${var.environment}/external-services"
  kms_key_id = var.kms_key_arn
  description = "V2 external service credentials (Sentry, PostHog, SES). Populate manually; never committed to repo."

  tags = {
    Name               = "${local.name}-external-services"
    Owner              = var.owner
    DataClassification = var.data_classification
  }
}
