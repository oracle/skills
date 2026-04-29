# `free` OCR Repository

## Overview

`database/free` is the Oracle Container Registry repository for Oracle Database Free. Oracle lists this repository in the OCR Database business area and publishes both a latest pull command and a tags table for selecting concrete image versions.

## Repository Snapshot

- **Registry path:** `container-registry.oracle.com/database/free`
- **OCR short description:** Oracle Database Free
- **Latest pull command shown on OCR:** `docker pull container-registry.oracle.com/database/free:latest`
- **License note on OCR:** OCR states that the software in this repository is licensed under the Oracle Free Use Terms and Conditions provided in the container image.

## What Oracle Documents Here

- The OCR readme documents `free` as Oracle AI Database 26ai Free on top of an Oracle Linux 8 base image.
- The page says the image contains a pre-built database for fast startup and is helpful in CI/CD scenarios.
- OCR also notes that Oracle Enterprise Manager Database Express is no longer supported with Oracle AI Database 26ai Free and recommends SQL Developer instead.

## Oracle Version Notes (19c vs 26ai)

The OCR detail page explicitly documents `free` as the Oracle AI Database 26ai Free container image. For a separate 19c line in the Autonomous Database Free family, OCR publishes `adb-free` with its own version matrix.

## When to Use / When Not to Use

- **Use this image when:** Use for local development and learning with Oracle AI Database 26ai Free.
- **Use another image when:** Avoid when you need Enterprise-only features or support commitments.
- **Cross-image decision aid:** `db/containers/container-selection-matrix.md`

## Prerequisites and Minimal Run Pattern

- **Prerequisite:** Accept OCR repository terms and authenticate to container-registry.oracle.com before pull.
- **Pull:** `docker pull container-registry.oracle.com/database/free:<tag>`
- **Run pattern:** `docker run --name <name> --rm -it container-registry.oracle.com/database/free:<tag>`
- **Important:** Use the OCR README example command for exact environment variables, mounted volumes, and published ports for this image.

## Sources

- https://container-registry.oracle.com/ords/ocr/ba/database/free
- https://www.oracle.com/database/free/
- https://www.oracle.com/database/sqldeveloper/
- https://www.oracle.com/downloads/licenses/oracle-free-license.html
