# `ords` OCR Repository

## Overview

`database/ords` is the Oracle Container Registry repository for Oracle REST Data Services (ORDS) command line interface.. Oracle lists this repository in the OCR Database business area and publishes both a latest pull command and a tags table for selecting concrete image versions.

## Repository Snapshot

- **Registry path:** `container-registry.oracle.com/database/ords`
- **OCR short description:** Oracle REST Data Services (ORDS) command line interface.
- **Latest pull command shown on OCR:** `docker pull container-registry.oracle.com/database/ords:latest`
- **License note on OCR:** OCR states that the software in this repository is licensed under the Oracle Free Use Terms and Conditions provided in the container image.

## What Oracle Documents Here

- The OCR detail page presents this repository as the Oracle REST Data Services command line interface container image.
- The page links to Oracle documentation for installing and configuring customer-managed ORDS against Autonomous Database.
- OCR publishes both a latest pull command and a tags table so you can choose the ORDS image version you want to run.

## Oracle Version Notes (19c vs 26ai)

The OCR detail page tracks ORDS image releases instead of a 19c-versus-26ai database matrix. Use the OCR tags table and the linked ORDS documentation to select the image version that matches your deployment target.

## When to Use / When Not to Use

- **Use this image when:** Use for supported ORDS container deployments.
- **Use another image when:** Avoid deprecated/legacy ORDS container lines for new deployments.
- **Cross-image decision aid:** `skills/containers/container-selection-matrix.md`

## Prerequisites and Minimal Run Pattern

- **Prerequisite:** Accept OCR repository terms and authenticate to container-registry.oracle.com before pull.
- **Pull:** `docker pull container-registry.oracle.com/database/ords:<tag>`
- **Run pattern:** `docker run --name <name> --rm -it container-registry.oracle.com/database/ords:<tag>`
- **Important:** Use the OCR README example command for exact environment variables, mounted volumes, and published ports for this image.

## Sources

- https://container-registry.oracle.com/ords/ocr/ba/database/ords
- https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/25.2/ordig/installing-and-configuring-customer-managed-ords-autonomous-database.html#GUID-AC7F9A42-A7C2-4453-B8D1-BFD2784C3CA0
