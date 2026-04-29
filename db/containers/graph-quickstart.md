# `graph-quickstart` OCR Repository

## Overview

`database/graph-quickstart` is the Oracle Container Registry repository for Get started with the Property Graph feature of Oracle AI Database 26ai. Oracle lists this repository in the OCR Database business area and publishes both a latest pull command and a tags table for selecting concrete image versions.

## Repository Snapshot

- **Registry path:** `container-registry.oracle.com/database/graph-quickstart`
- **OCR short description:** Get started with the Property Graph feature of Oracle AI Database 26ai
- **Latest pull command shown on OCR:** `docker pull container-registry.oracle.com/database/graph-quickstart:latest`
- **License note on OCR:** OCR presents this as a standard Oracle repository. The detail page prompts you to sign in with an Oracle account to accept the repository license agreement before downloading the image.

## What Oracle Documents Here

- The OCR readme describes this as the Oracle Graph Quickstart container image for the Property Graph feature of Oracle AI Database 26ai.
- The page says the image includes Oracle AI Database 26ai Free, a preconfigured `GRAPHUSER`, and a sample SQL Property Graph.
- OCR also notes that this image is not for production workloads, and that it is based on the Oracle AI Database 26ai Free container image (Lite).

## Oracle Version Notes (19c vs 26ai)

This repository is explicitly tied to Oracle AI Database 26ai. The OCR readme says the image is based on the 26ai Free container image and should not be used for production workloads.

## When to Use / When Not to Use

- **Use this image when:** Use for quick Property Graph exploration and demos on 26ai.
- **Use another image when:** Avoid for production workloads; use supported production deployment patterns.
- **Cross-image decision aid:** `db/containers/container-selection-matrix.md`

## Prerequisites and Minimal Run Pattern

- **Prerequisite:** Accept OCR repository terms and authenticate to container-registry.oracle.com before pull.
- **Pull:** `docker pull container-registry.oracle.com/database/graph-quickstart:<tag>`
- **Run pattern:** `docker run --name <name> --rm -it container-registry.oracle.com/database/graph-quickstart:<tag>`
- **Important:** Use the OCR README example command for exact environment variables, mounted volumes, and published ports for this image.

## Sources

- https://container-registry.oracle.com/ords/ocr/ba/database/graph-quickstart
- https://docs.oracle.com/en/database/oracle/property-graph/index.html
