# `otmm` OCR Repository

## Overview

`database/otmm` is the Oracle Container Registry repository for Oracle Transaction Manager for Microservices (MicroTx) Free. Oracle lists this repository in the OCR Database business area and publishes both a latest pull command and a tags table for selecting concrete image versions.

## Repository Snapshot

- **Registry path:** `container-registry.oracle.com/database/otmm`
- **OCR short description:** Oracle Transaction Manager for Microservices (MicroTx) Free
- **Latest pull command shown on OCR:** `docker pull container-registry.oracle.com/database/otmm:latest`
- **License note on OCR:** OCR states that the software in this repository is licensed under the Oracle Free Use Terms and Conditions provided in the container image.

## What Oracle Documents Here

- The OCR readme describes `otmm` as the free MicroTx image for helping maintain consistency across distributed microservices applications.
- The page says MicroTx supports XA, Saga based on Eclipse MicroProfile Long Running Action (LRA), and Try-Confirm/Cancel (TCC) style workflows.
- OCR links the install-and-use workflow and publishes both `latest` and versioned MicroTx tags for this repository.

## Oracle Version Notes (19c vs 26ai)

The OCR detail page tracks MicroTx image releases rather than a 19c-versus-26ai database matrix. Use the repository tags table to choose the MicroTx release you need.

## When to Use / When Not to Use

- **Use this image when:** Use when you need free MicroTx capabilities for distributed transaction patterns.
- **Use another image when:** Avoid when you need Enterprise coordinator/console features; use microtx-ee-* images.
- **Cross-image decision aid:** `skills/db/containers/container-selection-matrix.md`

## Prerequisites and Minimal Run Pattern

- **Prerequisite:** Accept OCR repository terms and authenticate to container-registry.oracle.com before pull.
- **Pull:** `docker pull container-registry.oracle.com/database/otmm:<tag>`
- **Run pattern:** `docker run --name <name> --rm -it container-registry.oracle.com/database/otmm:<tag>`
- **Important:** Use the OCR README example command for exact environment variables, mounted volumes, and published ports for this image.

## Sources

- https://container-registry.oracle.com/ords/ocr/ba/database/otmm
- https://docs.oracle.com/pls/topic/lookup?ctx=microtx-latest&id=TMMDG-GUID-F6ED47D2-97FE-481E-A41E-C320A3611C0B
- https://www.oracle.com/downloads/licenses/oracle-free-license.html
