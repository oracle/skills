# `enterprise` OCR Repository

## Overview

`database/enterprise` is the Oracle Container Registry repository for Oracle Database Enterprise Edition. Oracle lists this repository in the OCR Database business area and publishes both a latest pull command and a tags table for selecting concrete image versions.

## Repository Snapshot

- **Registry path:** `container-registry.oracle.com/database/enterprise`
- **OCR short description:** Oracle Database Enterprise Edition
- **Latest pull command shown on OCR:** `docker pull container-registry.oracle.com/database/enterprise:latest`
- **License note on OCR:** OCR presents this as a standard Oracle repository. The detail page prompts you to sign in with an Oracle account to accept the repository license agreement before downloading the image.

## What Oracle Documents Here

- The OCR readme documents this image as Oracle AI Database Server Release 26ai Enterprise Edition running on Oracle Linux 8.
- The page says the image contains a default database in a multitenant configuration with one pluggable database.
- The OCR documentation covers startup, connections, data-volume reuse, and SGA/PGA sizing with `INIT_SGA_SIZE` and `INIT_PGA_SIZE`.

## Oracle Version Notes (19c vs 26ai)

The OCR detail page explicitly documents `enterprise` as the 26ai Enterprise Edition server image. OCR publishes `enterprise_ru` separately for Release Update container images.

## When to Use / When Not to Use

- **Use this image when:** Use when you need Oracle AI Database 26ai Enterprise Edition in a container.
- **Use another image when:** Avoid when you need CPU/RU stream patch pinning; use enterprise_ru instead.
- **Cross-image decision aid:** `db/containers/container-selection-matrix.md`

## Prerequisites and Minimal Run Pattern

- **Prerequisite:** Accept OCR repository terms and authenticate to container-registry.oracle.com before pull.
- **Pull:** `docker pull container-registry.oracle.com/database/enterprise:<tag>`
- **Run pattern:** `docker run --name <name> --rm -it container-registry.oracle.com/database/enterprise:<tag>`
- **Important:** Use the OCR README example command for exact environment variables, mounted volumes, and published ports for this image.

## Sources

- https://container-registry.oracle.com/ords/ocr/ba/database/enterprise
