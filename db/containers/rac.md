# `rac` OCR Repository

## Overview

`database/rac` is the Oracle Container Registry repository for Oracle Real Application Clusters. Oracle lists this repository in the OCR Database business area and publishes both a latest pull command and a tags table for selecting concrete image versions.

## Repository Snapshot

- **Registry path:** `container-registry.oracle.com/database/rac`
- **OCR short description:** Oracle Real Application Clusters
- **Latest pull command shown on OCR:** `docker pull container-registry.oracle.com/database/rac:latest`
- **License note on OCR:** OCR presents this as a standard Oracle repository. The detail page prompts you to sign in with an Oracle account to accept the repository license agreement before downloading the image.

## What Oracle Documents Here

- The OCR readme describes `rac` as Oracle Real Application Clusters in Linux containers and covers preparation, installation, and validation steps.
- The page says RAC containers are supported for production use on Podman starting with Oracle Database 19c (19.16), 21c (21.7), and 23.26ai (26ai).
- OCR links the RAC installation guide for Podman on Oracle Linux and calls out preparation topics such as SELinux labeling, storage, and network planning.

## Oracle Version Notes (19c vs 26ai)

The OCR readme explicitly calls out support on Podman starting with 19c (19.16), 21c (21.7), and 23.26ai (26ai). Use the repository tags table to select the exact RAC container version.

## When to Use / When Not to Use

- **Use this image when:** Use when you need Oracle RAC container deployments with Podman guidance.
- **Use another image when:** Avoid when you need RU stream tags; use rac_ru.
- **Cross-image decision aid:** `db/containers/container-selection-matrix.md`

## Prerequisites and Minimal Run Pattern

- **Prerequisite:** Use Podman-based prerequisites from OCR RAC docs, including network/storage planning.
- **Pull:** `docker pull container-registry.oracle.com/database/rac:<tag>`
- **Run pattern:** `docker run --name <name> --rm -it container-registry.oracle.com/database/rac:<tag>`
- **Important:** Use the OCR README example command for exact environment variables, mounted volumes, and published ports for this image.

## Sources

- https://container-registry.oracle.com/ords/ocr/ba/database/rac
- https://docs.oracle.com/cd/F39414_01/racpd/oracle-real-application-clusters-installation-guide-podman-oracle-linux-x86-64.pdf
- https://docs.oracle.com/en/database/oracle/oracle-database/21/racpd/target-configuration-oracle-rac-podman.html#GUID-59138DF8-3781-4033-A38F-E0466884D008
