# `microtx-ee-console` OCR Repository

## Overview

`database/microtx-ee-console` is the Oracle Container Registry repository for Oracle Transaction Manager for Microservices(MicroTx) Console. Oracle lists this repository in the OCR Database business area and publishes both a latest pull command and a tags table for selecting concrete image versions.

## Repository Snapshot

- **Registry path:** `container-registry.oracle.com/database/microtx-ee-console`
- **OCR short description:** Oracle Transaction Manager for Microservices(MicroTx) Console
- **Latest pull command shown on OCR:** `docker pull container-registry.oracle.com/database/microtx-ee-console:latest`
- **License note on OCR:** OCR presents this as a standard Oracle repository. The detail page prompts you to sign in with an Oracle account to accept the repository license agreement before downloading the image.

## What Oracle Documents Here

- The OCR readme describes this image as the graphical web console for Oracle Transaction Manager for Microservices (MicroTx).
- The page says the console is used to manage and monitor transactions.
- OCR also says you can use the console only with MicroTx Enterprise Edition.

## Oracle Version Notes (19c vs 26ai)

The OCR detail page focuses on MicroTx release tags rather than a 19c-versus-26ai database matrix. Use the repository tags table to select the console version you need.

## When to Use / When Not to Use

- **Use this image when:** Use when you need the MicroTx Enterprise console UI for operations/monitoring.
- **Use another image when:** Avoid when you are not running MicroTx Enterprise coordinator workflows.
- **Cross-image decision aid:** `db/containers/container-selection-matrix.md`

## Prerequisites and Minimal Run Pattern

- **Prerequisite:** Accept OCR repository terms and authenticate to container-registry.oracle.com before pull.
- **Pull:** `docker pull container-registry.oracle.com/database/microtx-ee-console:<tag>`
- **Run pattern:** `docker run --name <name> --rm -it container-registry.oracle.com/database/microtx-ee-console:<tag>`
- **Important:** Use the OCR README example command for exact environment variables, mounted volumes, and published ports for this image.

## Sources

- https://container-registry.oracle.com/ords/ocr/ba/database/microtx-ee-console
- https://docs.oracle.com/pls/topic/lookup?ctx=microtx-latest&id=TMMDG-GUID-929926DE-384E-4426-9CBC-1B16940BE25C
- https://docs.oracle.com/pls/topic/lookup?ctx=microtx-latest&id=TMMDG-GUID-F6ED47D2-97FE-481E-A41E-C320A3611C0B
