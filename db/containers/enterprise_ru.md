# `enterprise_ru` OCR Repository

## Overview

`database/enterprise_ru` is the Oracle Container Registry repository for Oracle Database Enterprise Edition. Oracle lists this repository in the OCR Database business area and publishes both a latest pull command and a tags table for selecting concrete image versions.

## Repository Snapshot

- **Registry path:** `container-registry.oracle.com/database/enterprise_ru`
- **OCR short description:** Oracle Database Enterprise Edition
- **Latest pull command shown on OCR:** `docker pull container-registry.oracle.com/database/enterprise_ru:latest-19`
- **License note on OCR:** OCR states that you must accept the Oracle Container Registry Critical Patch Update (CPU) Repository Terms and Restrictions before downloading from this repository.

## What Oracle Documents Here

- The OCR readme documents this repository as Oracle Database Server Release Update 19c Docker image documentation.
- The page says the image runs on Oracle Linux 7 and contains a default multitenant database with one pluggable database.
- OCR covers startup, connections, patching the existing database, and SGA/PGA sizing for this Release Update image line.

## Oracle Version Notes (19c vs 26ai)

The OCR detail page explicitly documents this repository as the 19c Release Update image line, and the latest OCR pull command currently uses the `latest-19` tag stream.

## When to Use / When Not to Use

- **Use this image when:** Use when you need RU-tagged Enterprise images from the CPU repository stream.
- **Use another image when:** Avoid when you want the non-CPU latest stream; use enterprise instead.
- **Cross-image decision aid:** `db/containers/container-selection-matrix.md`

## Prerequisites and Minimal Run Pattern

- **Prerequisite:** Accept OCR repository terms and authenticate to container-registry.oracle.com before pull.
- **Pull:** `docker pull container-registry.oracle.com/database/enterprise_ru:<tag>`
- **Run pattern:** `docker run --name <name> --rm -it container-registry.oracle.com/database/enterprise_ru:<tag>`
- **Important:** Use the OCR README example command for exact environment variables, mounted volumes, and published ports for this image.

## Sources

- https://container-registry.oracle.com/ords/ocr/ba/database/enterprise_ru
