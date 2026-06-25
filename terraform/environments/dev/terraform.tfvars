project             = "intentional"
environment         = "dev"
aws_region          = "us-east-1"
owner               = "platform"
data_classification = "internal"

ecs_cpu           = 512
ecs_memory        = 1024
ecs_desired_count = 2

db_instance_class    = "db.t4g.micro"
db_allocated_storage = 20
