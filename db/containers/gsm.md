# `gsm` OCR Repository

## Overview

`database/gsm` is the Oracle Container Registry repository for Oracle Global Service Manager. Oracle lists this repository in the OCR Database business area and publishes both a latest pull command and a tags table for selecting concrete image versions.

## Repository Snapshot

- **Registry path:** `container-registry.oracle.com/database/gsm`
- **OCR short description:** Oracle Global Service Manager
- **Latest pull command shown on OCR:** `docker pull container-registry.oracle.com/database/gsm:latest`
- **License note on OCR:** OCR presents this as a standard Oracle repository. The detail page prompts you to sign in with an Oracle account to accept the repository license agreement before downloading the image.

## What Oracle Documents Here

- The OCR readme documents `gsm` as the Oracle Global Service Manager container for Oracle Globally Distributed Database on container.
- The page says the GSM container is required to configure Oracle Globally Distributed Database.
- The OCR documentation walks through Podman installation, network creation, host-file setup, and catalog-container deployment.

## Oracle Version Notes (19c vs 26ai)

The OCR detail page does not provide a dedicated 19c-versus-26ai matrix for `gsm`. Use the OCR tags table for the exact image version, or `gsm_ru` if you need the CPU repository stream.

## When to Use / When Not to Use

- **Use this image when:** Use when deploying Oracle Globally Distributed Database and GSM is required.
- **Use another image when:** Avoid when you need RU stream tagging; use gsm_ru.
- **Cross-image decision aid:** `db/containers/container-selection-matrix.md`

## Prerequisites and Minimal Run Pattern

- **Prerequisite:** Accept OCR repository terms and authenticate to container-registry.oracle.com before pull.
- **Pull:** `docker pull container-registry.oracle.com/database/gsm:<tag>`
- **Run pattern:** `docker run --name <name> --rm -it container-registry.oracle.com/database/gsm:<tag>`
- **Important:** Use the OCR README example command for exact environment variables, mounted volumes, and published ports for this image.

## Sources

- https://container-registry.oracle.com/ords/ocr/ba/database/gsm
- https://docs.oracle.com/en/operating-systems/oracle-linux/podman/toc.htm
