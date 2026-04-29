# `cman` OCR Repository

## Overview

`database/cman` is the Oracle Container Registry repository for Oracle Connection Manager. Oracle lists this repository in the OCR Database business area and publishes both a latest pull command and a tags table for selecting concrete image versions.

## Repository Snapshot

- **Registry path:** `container-registry.oracle.com/database/cman`
- **OCR short description:** Oracle Connection Manager
- **Latest pull command shown on OCR:** `docker pull container-registry.oracle.com/database/cman:latest`
- **License note on OCR:** OCR presents this as a standard Oracle repository. The detail page prompts you to sign in with an Oracle account to accept the repository license agreement before downloading the image.

## What Oracle Documents Here

- The OCR readme positions this image as Oracle Connection Manager in Linux containers for proxying and managing client database connections.
- The page says you can use the container with Oracle RAC or a single-instance Oracle Database, as long as the SCAN name or database hostname is resolvable from the container.
- The OCR readme examples currently use `container-registry.oracle.com/database/client-cman:latest`, while the repository pull-command section is published under `container-registry.oracle.com/database/cman:latest`.

## Oracle Version Notes (19c vs 26ai)

The OCR detail page does not publish a dedicated 19c-versus-26ai compatibility matrix for `cman`. Use the OCR tags table on the repository page to choose the image version you need.

## When to Use / When Not to Use

- **Use this image when:** Use when you need Oracle Connection Manager as a proxy/gateway layer.
- **Use another image when:** Avoid when clients can connect directly and no proxy tier is required.
- **Cross-image decision aid:** `db/containers/container-selection-matrix.md`

## Prerequisites and Minimal Run Pattern

- **Prerequisite:** Accept OCR repository terms and authenticate to container-registry.oracle.com before pull.
- **Pull:** `docker pull container-registry.oracle.com/database/cman:<tag>`
- **Run pattern:** `docker run --name <name> --rm -it container-registry.oracle.com/database/cman:<tag>`
- **Important:** Use the OCR README example command for exact environment variables, mounted volumes, and published ports for this image.

## Sources

- https://container-registry.oracle.com/ords/ocr/ba/database/cman
