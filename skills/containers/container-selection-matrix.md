# Oracle OCR Database Containers: Selection Matrix

## Overview

Use this guide to quickly choose the right Oracle Container Registry (OCR) database-category image before drilling into a repo-specific skill file.

## Quick Decision Matrix

| Repository | Choose This When | Avoid / Use Alternative When | What It Offers |
|---|---|---|---|
| `database/enterprise` | You need Oracle AI Database 26ai Enterprise Edition in a container | You need CPU RU stream images for patch-level pinning (`enterprise_ru`) | Full Enterprise server image, multitenant default setup |
| `database/enterprise_ru` | You need CPU repository / RU-tagged Enterprise images (commonly 19c stream) | You want latest non-CPU stream (`enterprise`) | RU-tagged Enterprise server images under CPU terms |
| `database/free` | You want Oracle AI Database 26ai Free for local development/learning | You need paid Enterprise capabilities | Fast-start Oracle Database Free server image |
| `database/adb-free` | You need Autonomous Database Free container workflows (`ADW`/`ATP`) | You just need generic Database Free (`free`) | Autonomous DB Free image with workload modes and version matrix |
| `database/rac` | You need Oracle RAC in containers (Podman-focused guidance) | You need RU-tagged RAC stream (`rac_ru`) | RAC container deployment line with production-focused docs |
| `database/rac_ru` | You need CPU/RU-tagged RAC images | You want non-RU RAC stream (`rac`) | RAC release-update image stream under CPU terms |
| `database/gsm` | You are deploying Oracle Globally Distributed Database and need GSM | You need RU-tagged GSM stream (`gsm_ru`) | Global Service Manager container for GDD setups |
| `database/gsm_ru` | You need CPU/RU-tagged GSM images | You want non-RU GSM stream (`gsm`) | GSM RU stream for GDD container topologies |
| `database/cman` | You need Oracle Connection Manager as a proxy/gateway for DB clients | You only need direct client-to-DB connectivity | Connection brokering/proxy image for DB network paths |
| `database/instantclient` | You need client-only tooling/libraries (OCI/OCCI/SQL*Plus) in containers | You need a full database server container | Instant Client packages (Basic/SDK/SQL*Plus) |
| `database/sqlcl` | You need SQLcl CLI in containerized automation or CI jobs | You need ORDS or database server runtime | SQL Command Line image with scriptable CLI workflows |
| `database/ords` | You need supported ORDS container CLI/runtime image | You need a non-deprecated ORDS image line for new deployments | Current ORDS container image line |
| `database/operator` | You run Oracle DB lifecycle through Kubernetes operator patterns | You are not using Kubernetes operator model | Oracle Database Operator image for Kubernetes automation |
| `database/observability-exporter` | You need metrics/logs/traces export for Oracle DB observability | You need a DB server image | OpenTelemetry-style exporter tooling image |
| `database/private-ai` | You need Oracle Private AI Services container deployment | You only need base database without Private AI service layer | Private AI service runtime with secure/non-secure setup modes |
| `database/graph-quickstart` | You want a fast Property Graph 26ai learning sandbox | You need production-grade graph deployment | Quickstart graph-focused image built on 26ai Free |
| `database/otmm` | You need free Oracle Transaction Manager for Microservices workflows | You need Enterprise edition features (`microtx-ee-coordinator`) | MicroTx Free image for distributed transaction patterns |
| `database/microtx-ee-coordinator` | You need MicroTx Enterprise coordinator features | You only need free variant (`otmm`) | Enterprise coordinator for XA/Saga/TCC patterns |
| `database/microtx-ee-console` | You need MicroTx Enterprise web console/monitoring | You are not running MicroTx EE coordinator | Console UI for MicroTx EE operations |

## Minimal Pull and Run Pattern

1. Sign in and accept repository terms on OCR for the target image.
2. Pull the image with an explicit tag when possible.
3. Start with the OCR README sample command for that repository.

```bash
docker login container-registry.oracle.com

docker pull container-registry.oracle.com/database/<repo>:<tag>

docker run --name <name> --rm -it container-registry.oracle.com/database/<repo>:<tag>
```

For database server images, add required environment variables, persistent volumes, and published ports exactly as documented on the repo page before production use.

## Oracle Version Notes (19c vs 26ai)

OCR container repositories are split across product lines, not a single unified 19c-vs-26ai matrix:

- 26ai-oriented images include repositories such as `enterprise`, `free`, and `graph-quickstart`.
- 19c/RU-oriented streams are surfaced in repositories such as `enterprise_ru` and `rac_ru`.
- Tooling/runtime images (`sqlcl`, `ords`, `operator`, `observability-exporter`, `instantclient`) use their own release tags and should be pinned by image tag.

## Sources

- https://container-registry.oracle.com/ords/ocr/ba/database
- https://container-registry.oracle.com/ords/ocr/ba/database/enterprise
- https://container-registry.oracle.com/ords/ocr/ba/database/enterprise_ru
- https://container-registry.oracle.com/ords/ocr/ba/database/free
- https://container-registry.oracle.com/ords/ocr/ba/database/adb-free
- https://container-registry.oracle.com/ords/ocr/ba/database/rac
- https://container-registry.oracle.com/ords/ocr/ba/database/rac_ru
- https://container-registry.oracle.com/ords/ocr/ba/database/gsm
- https://container-registry.oracle.com/ords/ocr/ba/database/gsm_ru
- https://container-registry.oracle.com/ords/ocr/ba/database/cman
- https://container-registry.oracle.com/ords/ocr/ba/database/instantclient
- https://container-registry.oracle.com/ords/ocr/ba/database/sqlcl
- https://container-registry.oracle.com/ords/ocr/ba/database/ords
- https://container-registry.oracle.com/ords/ocr/ba/database/operator
- https://container-registry.oracle.com/ords/ocr/ba/database/observability-exporter
- https://container-registry.oracle.com/ords/ocr/ba/database/private-ai
- https://container-registry.oracle.com/ords/ocr/ba/database/graph-quickstart
- https://container-registry.oracle.com/ords/ocr/ba/database/otmm
- https://container-registry.oracle.com/ords/ocr/ba/database/microtx-ee-coordinator
- https://container-registry.oracle.com/ords/ocr/ba/database/microtx-ee-console
