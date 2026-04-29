# `gsm_ru` OCR Repository

## Overview

`database/gsm_ru` is the Oracle Container Registry repository for Oracle Global Service Manager. Oracle lists this repository in the OCR Database business area and publishes both a latest pull command and a tags table for selecting concrete image versions.

## Repository Snapshot

- **Registry path:** `container-registry.oracle.com/database/gsm_ru`
- **OCR short description:** Oracle Global Service Manager
- **Latest pull command shown on OCR:** `docker pull container-registry.oracle.com/database/gsm_ru:latest-23`
- **License note on OCR:** OCR states that you must accept the Oracle Container Registry Critical Patch Update (CPU) Repository Terms and Restrictions before downloading from this repository.

## What Oracle Documents Here

- The OCR readme positions `gsm_ru` as the Global Service Manager image for Oracle Globally Distributed Database in the CPU repository stream.
- The page says the GSM container is required to configure Oracle Globally Distributed Database and shows it alongside Release Update database images.
- OCR documents Podman installation, bridge setup, host-file preparation, and container deployment steps for this repository.

## Oracle Version Notes (19c vs 26ai)

The OCR detail page does not publish a separate 19c-versus-26ai matrix for `gsm_ru`, but the repository is under CPU repository terms and the latest OCR pull command currently uses the `latest-23` tag stream.

## When to Use / When Not to Use

- **Use this image when:** Use when you need RU-tagged GSM images under CPU terms.
- **Use another image when:** Avoid when non-RU GSM stream is sufficient; use gsm.
- **Cross-image decision aid:** `db/containers/container-selection-matrix.md`

## Prerequisites and Minimal Run Pattern

- **Prerequisite:** Accept OCR repository terms and authenticate to container-registry.oracle.com before pull.
- **Pull:** `docker pull container-registry.oracle.com/database/gsm_ru:<tag>`
- **Run pattern:** `docker run --name <name> --rm -it container-registry.oracle.com/database/gsm_ru:<tag>`
- **Important:** Use the OCR README example command for exact environment variables, mounted volumes, and published ports for this image.

## Sources

- https://container-registry.oracle.com/ords/ocr/ba/database/gsm_ru
- https://docs.oracle.com/en/operating-systems/oracle-linux/podman/toc.htm
