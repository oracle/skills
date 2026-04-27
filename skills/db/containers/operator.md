# `operator` OCR Repository

## Overview

`database/operator` is the Oracle Container Registry repository for This image is part of and for use with the Oracle Database Operator for Kubernetes. Oracle lists this repository in the OCR Database business area and publishes both a latest pull command and a tags table for selecting concrete image versions.

## Repository Snapshot

- **Registry path:** `container-registry.oracle.com/database/operator`
- **OCR short description:** This image is part of and for use with the Oracle Database Operator for Kubernetes
- **Latest pull command shown on OCR:** `docker pull container-registry.oracle.com/database/operator:latest`
- **License note on OCR:** OCR states that the software in this repository is licensed under the Universal Permissive License (UPL).

## What Oracle Documents Here

- The OCR detail page says this image is part of and for use with the Oracle Database Operator for Kubernetes.
- The page describes the operator as an open source system that extends the Kubernetes API with custom resources and controllers for Oracle Database lifecycle automation.
- OCR points to the operator readme for installation and usage details, and the tags table includes both `latest` and versioned operator releases.

## Oracle Version Notes (19c vs 26ai)

The OCR detail page tracks operator-image releases instead of a 19c-versus-26ai database matrix. Use the repository tags table and the operator readme to match the operator version to your Kubernetes environment.

## When to Use / When Not to Use

- **Use this image when:** Use when Oracle Database lifecycle is managed through Kubernetes operator patterns.
- **Use another image when:** Avoid when you are not using Kubernetes operator-based operations.
- **Cross-image decision aid:** `skills/db/containers/container-selection-matrix.md`

## Prerequisites and Minimal Run Pattern

- **Prerequisite:** Kubernetes cluster and operator installation prerequisites apply; follow operator docs from OCR.
- **Pull:** `docker pull container-registry.oracle.com/database/operator:<tag>`
- **Run pattern:** `docker run --name <name> --rm -it container-registry.oracle.com/database/operator:<tag>`
- **Important:** Use the OCR README example command for exact environment variables, mounted volumes, and published ports for this image.

## Sources

- https://container-registry.oracle.com/ords/ocr/ba/database/operator
- https://github.com/oracle/oracle-database-operator#readme
