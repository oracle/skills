# `adb-free` OCR Repository

## Overview

`database/adb-free` is the Oracle Container Registry repository for Oracle Autonomous Database Free. Oracle lists this repository in the OCR Database business area and publishes both a latest pull command and a tags table for selecting concrete image versions.

## Repository Snapshot

- **Registry path:** `container-registry.oracle.com/database/adb-free`
- **OCR short description:** Oracle Autonomous Database Free
- **Latest pull command shown on OCR:** `docker pull container-registry.oracle.com/database/adb-free:latest`
- **License note on OCR:** OCR states that the software in this repository is licensed under the Oracle Free Use Terms and Conditions provided in the container image.

## What Oracle Documents Here

- The OCR readme says Oracle Autonomous Database Free supports two workload types: `ADW` and `ATP`.
- The page includes a version matrix showing `latest-23ai` for the 23ai line and `latest` for the 19c line, with specific release tags alongside each stream.
- OCR also documents container resource requirements of 4 CPUs and 8 GiB memory.

## Oracle Version Notes (19c vs 26ai)

The OCR detail page provides an explicit version matrix: the 23ai stream uses `latest-23ai`, while the 19c stream uses `latest`. Use that matrix instead of assuming a single default line.

## When to Use / When Not to Use

- **Use this image when:** Use when you need Autonomous Database Free container workflows (ADW/ATP modes).
- **Use another image when:** Avoid when a generic Database Free runtime is enough; use free.
- **Cross-image decision aid:** `skills/db/containers/container-selection-matrix.md`

## Prerequisites and Minimal Run Pattern

- **Prerequisite:** Accept OCR repository terms and authenticate to container-registry.oracle.com before pull.
- **Pull:** `docker pull container-registry.oracle.com/database/adb-free:<tag>`
- **Run pattern:** `docker run --name <name> --rm -it container-registry.oracle.com/database/adb-free:<tag>`
- **Important:** Use the OCR README example command for exact environment variables, mounted volumes, and published ports for this image.

## Sources

- https://container-registry.oracle.com/ords/ocr/ba/database/adb-free
- https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/autonomous-docker-container.html#GUID-03B5601E-E15B-4ECC-9929-D06ACF576857
- https://www.oracle.com/downloads/licenses/oracle-free-license.html
