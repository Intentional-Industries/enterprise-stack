data "aws_caller_identity" "current" {}

# Shared secret used to verify ALB requests originate from CloudFront
resource "random_password" "cloudfront_secret" {
  length  = 32
  special = false
}

module "network" {
  source = "./modules/network"

  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region
}

module "security" {
  source = "./modules/security"

  project             = var.project
  environment         = var.environment
  vpc_id              = module.network.vpc_id
  owner               = var.owner
  data_classification = var.data_classification
  account_id          = data.aws_caller_identity.current.account_id
  aws_region          = var.aws_region
}

module "observability" {
  source = "./modules/observability"

  project             = var.project
  environment         = var.environment
  kms_key_arn         = module.security.kms_key_arn
  kms_key_id          = module.security.kms_key_id
  account_id          = data.aws_caller_identity.current.account_id
  aws_region          = var.aws_region
  owner               = var.owner
  data_classification = var.data_classification
}

module "data" {
  source = "./modules/data"

  project              = var.project
  environment          = var.environment
  kms_key_arn          = module.security.kms_key_arn
  rds_sg_id            = module.security.rds_sg_id
  data_subnet_ids      = module.network.data_subnet_ids
  db_instance_class    = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  owner                = var.owner
  data_classification  = var.data_classification
}

module "identity" {
  source = "./modules/identity"

  project     = var.project
  environment = var.environment
}

module "compute" {
  source = "./modules/compute"

  project                 = var.project
  environment             = var.environment
  aws_region              = var.aws_region
  vpc_id                  = module.network.vpc_id
  public_subnet_ids       = module.network.public_subnet_ids
  private_subnet_ids      = module.network.private_subnet_ids
  alb_sg_id               = module.security.alb_sg_id
  ecs_sg_id               = module.security.ecs_sg_id
  kms_key_arn             = module.security.kms_key_arn
  app_log_group_name      = module.observability.app_log_group_name
  ecr_repository_url      = module.observability.ecr_repository_url
  app_image               = var.app_image
  ecs_cpu                 = var.ecs_cpu
  ecs_memory              = var.ecs_memory
  ecs_desired_count       = var.ecs_desired_count
  db_secret_arn           = module.data.db_secret_arn
  db_name                 = module.data.db_name
  db_host                 = module.data.db_endpoint
  db_port                 = module.data.db_port
  session_secret_arn      = module.data.session_secret_arn
  cognito_user_pool_id    = module.identity.user_pool_id
  cognito_client_id       = module.identity.user_pool_client_id
  cloudfront_secret       = random_password.cloudfront_secret.result
  account_id              = data.aws_caller_identity.current.account_id
  user_pool_arn           = module.identity.user_pool_arn
}

module "edge" {
  source = "./modules/edge"

  project           = var.project
  environment       = var.environment
  alb_dns_name      = module.compute.alb_dns_name
  cloudfront_secret = random_password.cloudfront_secret.result
  alb_listener_arn  = module.compute.alb_listener_arn
  logging_bucket_id = module.observability.audit_bucket_id
  aws_region        = var.aws_region
}
