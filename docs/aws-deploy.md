# AWS Production Deployment Architecture

This document describes the production deployment path for Tara.

## Architecture Overview

1.  **Frontend (React/Vite)**
    *   **Hosting:** Amazon S3 bucket configured for static website hosting.
    *   **CDN:** Amazon CloudFront distribution routing traffic to the S3 bucket to ensure global, low-latency access and HTTPS termination.

2.  **Backend (Node.js/Express)**
    *   **Hosting:** Amazon Elastic Container Service (ECS) running on AWS Fargate (Serverless Compute).
    *   **Load Balancing:** Application Load Balancer (ALB) distributing traffic to Fargate tasks, handling SSL/TLS termination, and providing health checks.

3.  **LLM Orchestration (Local Open Source)**
    *   **Model Provider:** Ollama running `llama3.2:3b` or `qwen2.5:7b` locally.
    *   **Scaling:** For production throughput, this exact same open-source model architecture can be moved to an **Amazon EC2 GPU instance (e.g. g5.xlarge)** or **Amazon SageMaker Endpoints**. This ensures the data stays entirely private and open-source, rather than relying on external APIs.

4.  **Vector Store (RAG)**
    *   **Service:** Amazon OpenSearch Service (Serverless) for storing and retrieving policy embeddings at scale.

5.  **Core Banking API Integration**
    *   **Security:** AWS PrivateLink or mTLS (Mutual TLS) to securely connect the Tara VPC to the mock/real core banking APIs, ensuring data never traverses the public internet.

## CI/CD Pipeline
- GitHub Actions or AWS CodePipeline to automate the building of Docker images, pushing to Amazon ECR (Elastic Container Registry), and deploying the updated tasks to ECS.
