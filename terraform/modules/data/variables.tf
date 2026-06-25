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

variable "rds_sg_id" {
  description = "Security group ID to attach to RDS"
  type        = string
}

variable "data_subnet_ids" {
  description = "Subnet IDs for the RDS subnet group"
  type        = list(string)
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "db_allocated_storage" {
  type    = number
  default = 20
}

variable "owner" {
  type    = string
  default = "platform"
}

variable "data_classification" {
  type    = string
  default = "internal"
}
