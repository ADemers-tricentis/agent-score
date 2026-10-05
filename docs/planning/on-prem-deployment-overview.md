# AgentScore On-Prem Deployment: Overview

## Model
Self-hosted in the client's AWS account. Tricentis supplies the software and an on-site engineer. The client supplies the infrastructure.

- **AWS account:** Accenture suggested providing its own AWS account for the deployment, with Tricentis pushing images to a registry there rather than hosting it. 
- **Updates:** Tricentis pushes images to a registry client provides (or SFTP/repo, push-only, tagged `latest`).

## Prerequisites

**Client provides**
- AWS account and VPC (private subnets in at least 2 AZs, outbound access or an agreed offline mode)
- Container registry (push-only for Tricentis)
- TLS certificate and DNS names for the back office, customer app and trace ingest
- Postgres 18 with TLS enforced and a direct (non-pooled) connection, because ingest uses LISTEN/NOTIFY
- S3-compatible object store (S3 or MinIO) for trace payloads
- Judge LLM endpoint
- A route for agents to reach ingest (OTLP over HTTPS)

**Tricentis provides**
- Container images and a docker-compose or Kubernetes manifest package
- License file with an expiry date (the beta kill-switch)
- Fresh secrets per install (encryption key, HMAC secrets, setup token), never reused across installs

**Install order:** data stores, secrets, database role provisioning, then platform, worker and ingest.

## Recommended Use Case Criteria
- Agents already emit OpenTelemetry traces or can add an exporter. Integration takes an endpoint and an API key.
- Agents run on real traffic.
- 4 to 5 agents, including one hierarchy (functional, value stream, enterprise).
- Confirmed telemetry stack.

## Sizing (estimate, 4 to 5 agents)
- **Total:** about 6 vCPU and 11 GB RAM, plus OS headroom
- **Single host (docker-compose):** m6i.xlarge minimum, m6i.2xlarge recommended, 100 GB gp3. Avoid burstable t3 types. Use x86 until the images are confirmed multi-arch.
- **Multi-node Kubernetes:** size per component

| Component | Estimate |
|---|---|
| Ingest | 1 vCPU, 2 GiB |
| Platform | 1 vCPU, 2 GiB |
| Scoring worker | 1 to 2 vCPU, 2 GiB |
| Postgres | 2 vCPU, 4 GB (max_connections = 300) |
| Object store (MinIO) | 0.5 vCPU, 1 GB |

**Ports:** platform 8080 (back office), 8081 (customer), 8082 (gateway, private); ingest 8001; worker 8002 (internal only).

## Trace Volume (estimate)
- **Start:** about 20 traces per agent
- **Meaningful score:** 50 or more per agent
- **Baseline:** a few hundred per agent, 1,500 or more across the POC
- **Throughput:** no ceiling measured. One ingest replica should handle up to a few thousand traces per day (unvalidated). Judge latency and LLM rate limits will cap scoring first.

## Support Model
- A Tricentis engineer travels on-site and runs the install (1 to 2 days), then splits time between development and POC support.
- Product is available for walkthroughs.

## POC Duration
Four weeks from date of install.

## Open Questions
1. **Beta agreement proof:** Can Accenture provide a send-home or API mechanism so we get proof they accepted the beta click-through?
2. **Deploy target:** Which host, environment and path in Accenture's AWS account receives the compose or Kubernetes package? Ideally Tricentis pushes updates as a new image tagged `latest`.
3. **Login:** Can authentication stay on Tricentis's cloud identity service, or must it be fully self-contained? If it can't stay in the cloud, it needs its own approval.
4. **Kill switch**: Can Tricentis use an encrypted license file that must be uploaded to continue using the product?
