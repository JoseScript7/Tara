# ADR-001: Ontology Store — Neptune vs Postgres-Backed Graph

**Status:** PROPOSED
**Date:** 2026-10-28
**Context:** Tara needs a typed knowledge graph (Merchant, Device, Telemetry, Transaction, Settlement, Ticket, PolicyRule, Action) with explainable path queries.

## Options

### Option A: Amazon Neptune (Full Profile)
- **Pros:** Purpose-built graph database, native Gremlin/SPARQL, optimized for traversals, managed service
- **Cons:** Hourly billing (~$0.348/hr for db.t3.medium in ap-south-1, **UNVERIFIED — check current pricing**), minimum 1 instance always running, separate service to manage, limited Terraform support for some features
- **Tradeoff:** Better query performance for deep graph traversals, but higher cost for a demo

### Option B: Postgres Adjacency Tables + Recursive CTEs (Lean Profile)
- **Pros:** Uses existing Aurora PostgreSQL (no extra cost), simpler ops, single database, well-understood, recursive CTEs handle multi-hop paths
- **Cons:** Graph queries are less natural in SQL, performance degrades on deep traversals (>5 hops), no native graph visualization
- **Tradeoff:** Lower cost and complexity, slightly less elegant queries

## Recommendation

| Profile | Choice | Rationale |
|---|---|---|
| **Lean** | Postgres adjacency tables | Single DB, zero extra cost, sufficient for demo-depth graphs (3-4 hops) |
| **Full** | Neptune | Show the architecture on slides, real graph DB for judges to inspect |

## Unverified Facts
- Neptune pricing in ap-south-1 (checked general pricing page but exact current instance costs may differ)
- Neptune Terraform resource stability for `aws_neptune_cluster` and `aws_neptune_cluster_instance`
- Whether Neptune Serverless is available in ap-south-1

## Decision
**Use Postgres adjacency tables for lean profile (default).** Neptune available via `profile = "full"`.

---

# ADR-002: Vector Store — OpenSearch vs pgvector

**Status:** PROPOSED
**Date:** 2026-10-28
**Context:** Tara needs vector search for Second Brain (merchant memory, team lessons, policy retrieval) and Policy RAG.

## Options

### Option A: Amazon OpenSearch Service (Full Profile)
- **Pros:** Purpose-built search, rich query DSL, hybrid keyword+vector, managed, auto-scaling (Serverless option)
- **Cons:** Expensive (Serverless minimum ~$0.24/OCU-hour, **UNVERIFIED**), separate infrastructure, additional Terraform modules, more complex auth/networking
- **Tradeoff:** Better search quality and scale, significantly higher cost

### Option B: pgvector Extension in Aurora PostgreSQL (Lean Profile)
- **Pros:** Zero extra cost (uses existing Aurora), single database, simple SQL queries, adequate for demo-scale data (~300 merchants, ~1000 policy chunks)
- **Cons:** Less sophisticated ranking than OpenSearch, no built-in keyword+vector hybrid (requires manual implementation), potential performance limits at scale
- **Tradeoff:** Much simpler and cheaper, sufficient for hackathon scale

## Recommendation

| Profile | Choice | Rationale |
|---|---|---|
| **Lean** | pgvector in Aurora | Single DB, demo-scale data fits easily, zero extra cost |
| **Full** | OpenSearch Serverless | Show enterprise-grade search capability |

## Unverified Facts
- OpenSearch Serverless pricing in ap-south-1
- pgvector extension availability in Aurora PostgreSQL ap-south-1 (likely available but should verify)
- Bedrock embedding model for generating vectors (check Bedrock docs for available embedding models in ap-south-1)

## Decision
**Use pgvector for lean profile (default).** OpenSearch available via `profile = "full"`.

---

# ADR-003: Streaming — MSK vs MSK Serverless vs SQS/EventBridge

**Status:** PROPOSED
**Date:** 2026-10-28
**Context:** Tara needs event streaming for telemetry, transactions, signals, and agent decisions.

## Options

### Option A: Amazon MSK (Full Profile)
- **Pros:** Full Apache Kafka, broad ecosystem, exactly-once semantics, consumer groups, ordered partitions
- **Cons:** Very expensive (broker instances bill hourly, minimum 2 brokers, **UNVERIFIED** but likely $0.21+/hr each), complex setup, overkill for demo traffic
- **Tradeoff:** Production-grade streaming, but burns budget fast

### Option B: MSK Serverless
- **Pros:** No broker management, pay per throughput, Kafka-compatible
- **Cons:** **UNVERIFIED** whether available in ap-south-1, potentially still expensive, cold start latency
- **Tradeoff:** Simpler ops than MSK but uncertain availability

### Option C: SQS + EventBridge behind an EventBus Interface (Lean Profile)
- **Pros:** Pay-per-message (near-zero at demo scale), no infrastructure management, simple, reliable
- **Cons:** No Kafka semantics (no ordered partitions, no consumer groups), not "streaming" in the traditional sense
- **Tradeoff:** Drastically cheaper and simpler, but less impressive on slides

## Recommendation

| Profile | Choice | Rationale |
|---|---|---|
| **Lean** | SQS + EventBridge behind an `EventBus` interface | Near-zero cost, adequate for demo, interface allows swap to MSK |
| **Full** | MSK | Real Kafka for slide credibility |

**Critical design point:** Build an `EventBus` abstraction layer so the transport is swappable. All producers and consumers use the interface, not the transport directly.

## Unverified Facts
- MSK pricing in ap-south-1 (hourly broker costs)
- MSK Serverless availability in ap-south-1
- SQS FIFO ordering guarantees (sufficient for demo but verify exact semantics)

## Decision
**Use SQS + EventBridge for lean profile (default).** MSK available via `profile = "full"`.

---

# ADR-004: Compute — ECS Fargate

**Status:** PROPOSED
**Date:** 2026-10-28
**Context:** Tara needs containerized compute for API, agent workers, simulator, and Core Mock.

## Options

### Option A: ECS Fargate (Chosen)
- **Pros:** Serverless containers, no EC2 management, per-second billing, integrates with ALB/CloudMap/ECR, good Terraform support
- **Cons:** Cold start for scale-from-zero, slightly higher per-vCPU cost than EC2, 4 vCPU / 30 GB max per task
- **Tradeoff:** Simplicity and security vs cost efficiency

### Option B: ECS on EC2
- **Pros:** Cheaper per-unit compute, GPU support for local models
- **Cons:** Must manage instances, AMIs, patching, capacity providers
- **Tradeoff:** Not worth the ops burden for a hackathon

### Option C: Lambda
- **Pros:** True pay-per-invocation, auto-scaling
- **Cons:** 15-minute timeout, cold starts, not suitable for long-running agent workflows
- **Tradeoff:** Wrong tool for agent workloads

## Decision
**ECS Fargate.** No alternative needed — both lean and full profiles use Fargate.

## Unverified Facts
- Fargate pricing in ap-south-1 (verify vCPU and GB-hour rates)
- Minimum task size for Python FastAPI + LangGraph agent

---

# ADR-005: mTLS Approach — ACM Private CA vs Self-Managed

**Status:** PROPOSED
**Date:** 2026-10-28
**Context:** The Agent must authenticate to the Core Mock via mTLS to prove "core banking is never publicly exposed."

## Options

### Option A: ACM Private CA
- **Pros:** Managed service, integrates with ACM, auto-renewal, audit via CloudTrail
- **Cons:** **$400/month** per CA (**UNVERIFIED — check current pricing**), may be excessive for a hackathon demo
- **Tradeoff:** Enterprise-grade but very expensive for a demo

### Option B: Self-Managed CA with Short-Lived Certs in Secrets Manager (Chosen)
- **Pros:** Near-zero cost, full control, certs stored in Secrets Manager, can generate with `openssl` in CI/CD
- **Cons:** Must manage rotation manually, no auto-renewal, more error-prone setup
- **Tradeoff:** Appropriate for a demo, easy to explain

## Recommendation

| Profile | Choice | Rationale |
|---|---|---|
| **Both** | Self-managed CA | ACM Private CA cost is unjustifiable for a demo |

## Implementation
1. Generate a root CA certificate and key at bootstrap time
2. Generate server cert (Core Mock) and client cert (Agent) signed by the CA
3. Store all certs/keys in Secrets Manager
4. Core Mock Nginx/app verifies client certificate against the CA
5. Agent presents client certificate on every call
6. Rotate by re-running the generation script; short-lived certs (30 days) for demo

## Unverified Facts
- ACM Private CA pricing (believed to be $400/month but may have changed)
- Whether ECS Fargate tasks can mount Secrets Manager values as files (needed for TLS config)

## Decision
**Self-managed CA with certs in Secrets Manager.**

---

# ADR-006: Region and Bedrock Model Availability

**Status:** PROPOSED
**Date:** 2026-10-28
**Context:** Tara targets Indian merchants; `ap-south-1` (Mumbai) is the natural region. Bedrock availability varies.

## Region Choice
**`ap-south-1` (Mumbai)** — lowest latency for Indian users, data stays in India.

## Bedrock Model Availability (MUST VERIFY)

> ⚠️ **The following is based on general knowledge and MUST be verified against the current AWS Bedrock console or documentation before deploying.**

| Model | Expected Availability in ap-south-1 | Status |
|---|---|---|
| Claude 3.5 Sonnet | Likely available | **UNVERIFIED** |
| Claude 3 Haiku | Likely available | **UNVERIFIED** |
| Claude 3 Opus | May require cross-region inference | **UNVERIFIED** |
| Titan Embeddings | Likely available | **UNVERIFIED** |

## Action Items
1. Check the Bedrock console in ap-south-1 for available models
2. If Claude is not available in ap-south-1, enable cross-region inference or use a different region
3. Make the model ID an environment variable / Terraform variable, never hardcode
4. If using cross-region inference, document the latency impact

## Terraform Variable
```hcl
variable "bedrock_model_id" {
  type        = string
  description = "Bedrock model ID. Verify availability in your region."
  # Do not set a default — force explicit verification
}

variable "bedrock_embedding_model_id" {
  type        = string
  description = "Bedrock embedding model ID for vector generation."
}
```

## Unverified Facts
- Exact Claude model IDs available in ap-south-1 as of October 2026
- Whether cross-region inference is needed and its cost/latency impact
- Bedrock Guardrails resource names in Terraform AWS provider

## Decision
**Region: ap-south-1. Model ID: configurable variable, verified at deploy time.**
