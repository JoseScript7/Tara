# ──────────────────────────────────────────────
# Tara — Core Bank Mock Module
# Separate VPC, PrivateLink, mTLS
# ──────────────────────────────────────────────

variable "env" {
  type = string
}

variable "region" {
  type    = string
  default = "ap-south-1"
}

variable "tara_vpc_id" {
  type        = string
  default     = ""
  description = "Tara VPC ID for PrivateLink consumer"
}

variable "tara_private_subnet_ids" {
  type    = list(string)
  default = []
}

locals {
  mock_vpc_cidr     = "10.1.0.0/16"
  mock_subnets      = ["10.1.1.0/24", "10.1.2.0/24"]
  azs               = ["${var.region}a", "${var.region}b"]
}

# ─── Separate VPC for Core Mock ──────────────

resource "aws_vpc" "corebank" {
  cidr_block           = local.mock_vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name    = "tara-${var.env}-corebank-vpc"
    Purpose = "SIMULATED core banking - isolated from Tara VPC"
  }
}

resource "aws_subnet" "corebank" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.corebank.id
  cidr_block        = local.mock_subnets[count.index]
  availability_zone = local.azs[count.index]

  tags = {
    Name = "tara-${var.env}-corebank-subnet-${count.index}"
    Tier = "private"
  }
}

# ─── Security Group ──────────────────────────

resource "aws_security_group" "corebank" {
  name_prefix = "tara-${var.env}-corebank-"
  vpc_id      = aws_vpc.corebank.id

  # Only accept traffic from NLB (PrivateLink)
  ingress {
    from_port   = 8443
    to_port     = 8443
    protocol    = "tcp"
    cidr_blocks = [local.mock_vpc_cidr]
    description = "mTLS from PrivateLink NLB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "tara-${var.env}-corebank-sg"
  }
}

# ─── NLB for PrivateLink Endpoint Service ────

resource "aws_lb" "corebank" {
  name               = "tara-${var.env}-corebank-nlb"
  internal           = true
  load_balancer_type = "network"
  subnets            = aws_subnet.corebank[*].id

  tags = {
    Name = "tara-${var.env}-corebank-nlb"
  }
}

resource "aws_lb_target_group" "corebank" {
  name        = "tara-${var.env}-corebank"
  port        = 8443
  protocol    = "TCP"
  vpc_id      = aws_vpc.corebank.id
  target_type = "ip"

  health_check {
    protocol            = "TCP"
    port                = 8443
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 30
  }

  tags = {
    Name = "tara-${var.env}-corebank-tg"
  }
}

resource "aws_lb_listener" "corebank" {
  load_balancer_arn = aws_lb.corebank.arn
  port              = 8443
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.corebank.arn
  }
}

# ─── VPC Endpoint Service (PrivateLink) ──────

resource "aws_vpc_endpoint_service" "corebank" {
  acceptance_required        = false
  network_load_balancer_arns = [aws_lb.corebank.arn]

  tags = {
    Name = "tara-${var.env}-corebank-endpoint-service"
  }
}

# ─── ECS for Core Mock (in corebank VPC) ─────

resource "aws_ecs_cluster" "corebank" {
  name = "tara-${var.env}-corebank"

  tags = {
    Name    = "tara-${var.env}-corebank-cluster"
    Purpose = "SIMULATED core banking"
  }
}

resource "aws_cloudwatch_log_group" "corebank" {
  name              = "/ecs/tara-${var.env}-corebank"
  retention_in_days = 7

  tags = {
    Name = "tara-${var.env}-corebank-logs"
  }
}

# ─── Outputs ─────────────────────────────────

output "corebank_vpc_id" {
  value = aws_vpc.corebank.id
}

output "endpoint_service_name" {
  value = aws_vpc_endpoint_service.corebank.service_name
}

output "corebank_nlb_dns" {
  value = aws_lb.corebank.dns_name
}
