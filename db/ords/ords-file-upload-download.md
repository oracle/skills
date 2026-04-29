# ORDS File Upload and Download: BLOB Handling via REST

## Overview

ORDS provides native support for file upload and download through HTTP. Files are stored in Oracle Database BLOB columns and served back via REST endpoints with correct MIME type headers. This pattern is used for document management systems, image repositories, report archives, and any application that needs to store and retrieve binary content alongside relational metadata.

ORDS handles BLOB data transparently: uploaded file content is bound to PL/SQL handlers as a BLOB via the `:body` implicit parameter, and downloaded content is streamed directly from the database with the appropriate Content-Type header.

---

## Database Setup: Tables for File Storage

```sql
-- General-purpose document storage table
CREATE TABLE hr.documents (
  document_id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_id    NUMBER          REFERENCES hr.employees(employee_id),
  filename       VARCHAR2(255)   NOT NULL,
  content_type   VARCHAR2(100)   NOT NULL,
  file_size      NUMBER,
  file_content   BLOB,
  description    VARCHAR2(1000),
  uploaded_by    VARCHAR2(100),
  upload_date    TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP,
  CONSTRAINT uk_docs_emp_file UNIQUE (employee_id, filename)
);

-- Use SECUREFILE LOB storage for performance
-- (specify at CREATE TABLE time for new tables)
CREATE TABLE hr.document_store (
  doc_id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  filename       VARCHAR2(255) NOT NULL,
  content_type   VARCHAR2(100) NOT NULL,
  file_content   BLOB,
  created_at     TIMESTAMP DEFAULT SYSTIMESTAMP
)
LOB (file_content) STORE AS SECUREFILE (
  ENABLE STORAGE IN ROW
  COMPRESS MEDIUM
  DEDUPLICATE
  CACHE
);
```

---

## Uploading Files via REST

### Understanding `:body` and `:content_type`

When an HTTP client sends a request with a binary body:
- **`:body`** — The raw request body as a BLOB. This is the file content.
- **`:body_text`** — The raw request body as a CLOB (for text payloads).
- **`:content_type`** — The value of the `Content-Type` request header.

These are ORDS implicit bind parameters available in any `plsql/block` handler.

If a handler needs to inspect or reuse `:body` or `:body_text` more than once, assign it to a local PL/SQL variable first. ORDS documents that these payload binds must be dereferenced exactly once, and later reads can be empty.

### Simple Binary Upload (PUT/POST with raw body)

The simplest upload pattern: the HTTP body IS the file.

```sql
-- Define upload handler
BEGIN
  ORDS.DEFINE_MODULE(
    p_module_name => 'hr.docs',
    p_base_path   => '/docs/',
    p_status      => 'PUBLISHED'
  );

  ORDS.DEFINE_TEMPLATE(
    p_module_name => 'hr.docs',
    p_pattern     => 'employees/:employee_id/documents/:filename'
  );

  -- PUT: Upload/replace a document
  ORDS.DEFINE_HANDLER(
    p_module_name => 'hr.docs',
    p_pattern     => 'employees/:employee_id/documents/:filename',
    p_method      => 'PUT',
    p_source_type => ORDS.source_type_plsql,
    p_mimes_allowed => '',  -- Accept any content type
    p_source      => q'[
      DECLARE
        l_doc_id     hr.documents.document_id%TYPE;
        l_body_blob  BLOB := :body;
        l_file_size  NUMBER;
      BEGIN
        l_file_size := DBMS_LOB.GETLENGTH(l_body_blob);

        -- Validate file size (10MB limit)
        IF l_file_size > 10 * 1024 * 1024 THEN
          :status_code := 413;  -- Payload Too Large
          RETURN;
        END IF;

        -- Upsert the document
        BEGIN
          INSERT INTO hr.documents (
            employee_id, filename, content_type,
            file_size, file_content, uploaded_by, upload_date
          ) VALUES (
            :employee_id, :filename, :content_type,
            l_file_size, l_body_blob,
            :current_user, SYSTIMESTAMP
          )
          RETURNING document_id INTO l_doc_id;

          :status_code := 201;
        EXCEPTION
          WHEN DUP_VAL_ON_INDEX THEN
            UPDATE hr.documents
            SET    file_content  = l_body_blob,
                   content_type  = :content_type,
                   file_size     = l_file_size,
                   uploaded_by   = :current_user,
                   upload_date   = SYSTIMESTAMP
            WHERE  employee_id = :employee_id
            AND    filename    = :filename
            RETURNING document_id INTO l_doc_id;

            :status_code := 200;
        END;

        COMMIT;
      END;
    ]'
  );
  COMMIT;
END;
/
```

Example upload request using curl:

```shell
# Upload a PDF document
curl -X PUT \
  https://myserver.example.com/ords/hr/docs/employees/101/documents/resume.pdf \
  -H "Content-Type: application/pdf" \
  -H "Authorization: Bearer <token>" \
  --data-binary @/path/to/resume.pdf

# Upload an image
curl -X PUT \
  https://myserver.example.com/ords/hr/docs/employees/101/documents/photo.jpg \
  -H "Content-Type: image/jpeg" \
  --data-binary @/path/to/photo.jpg
```

### Multipart Form Data Upload

For HTML form-based uploads (browsers sending `multipart/form-data`), ORDS can natively handle the multipart `POST` request. Form fields are available through `:body_json`, and uploaded files can be processed with `ORDS.BODY_FILE_COUNT` and `ORDS.GET_BODY_FILE`.

Do not dereference both `:body` and `:body_text` in the same PL/SQL block. ORDS allows only one of those stream parameters per handler, and each stream bind must be dereferenced at most once unless it is first copied to a local variable. If you use `:body` or `:body_text`, you also cannot rely on JSON attribute bind notation from the request payload.

```sql
-- Handler for multipart upload with form fields and files
ORDS.DEFINE_HANDLER(
  p_module_name   => 'hr.docs',
  p_pattern       => 'upload/',
  p_method        => 'POST',
  p_source_type   => ORDS.source_type_plsql,
  p_mimes_allowed => 'multipart/form-data',
  p_source        => q'[
    DECLARE
      l_parameter_name VARCHAR2(4000);
      l_file_name      VARCHAR2(4000);
      l_content_type   VARCHAR2(200);
      l_file_body      BLOB;
      l_body_json      CLOB := :body_json;
    BEGIN
      FOR i IN 1 .. ORDS.BODY_FILE_COUNT LOOP
        ORDS.GET_BODY_FILE(
          p_file_index     => i,
          p_parameter_name => l_parameter_name,
          p_file_name      => l_file_name,
          p_content_type   => l_content_type,
          p_file_blob      => l_file_body
        );

        INSERT INTO hr.documents (
          employee_id, filename, content_type,
          file_size, file_content, uploaded_by, upload_date
        ) VALUES (
          JSON_VALUE(l_body_json, '$.employee_id' RETURNING NUMBER),
          l_file_name,
          l_content_type,
          DBMS_LOB.GETLENGTH(l_file_body),
          l_file_body,
          COALESCE(JSON_VALUE(l_body_json, '$.uploaded_by'), :current_user),
          SYSTIMESTAMP
        );
      END LOOP;

      COMMIT;
      :status_code := 201;
    END;
  ]'
);
```

**Recommendation**: Native ORDS multipart handling is sufficient when a request needs both form fields and one or more files. APEX remains a good option for browser-based applications, but it is not required for multipart parsing. For service-to-service uploads where the request body is only the file, prefer the direct binary PUT/POST approach with the file as the raw body.

For upload handlers, only set `:forward_location` if you intentionally want ORDS to execute a follow-up `GET` and return that representation as the upload response. Otherwise, return `201` or `200` without `:forward_location` and let the client fetch the `/content` resource separately.

---

## Downloading Files (BLOBs) via REST

### Using `source_type_media`

The `media` source type is designed specifically for returning binary or text content. The SQL should return:
1. The media type first (for example `application/pdf` or `image/jpeg`)
2. The representation second as a BLOB or CLOB

```sql
BEGIN
  ORDS.DEFINE_TEMPLATE(
    p_module_name => 'hr.docs',
    p_pattern     => 'employees/:employee_id/documents/:filename/content'
  );

  -- GET: Download file content
  ORDS.DEFINE_HANDLER(
    p_module_name => 'hr.docs',
    p_pattern     => 'employees/:employee_id/documents/:filename/content',
    p_method      => 'GET',
    p_source_type => ORDS.source_type_media,
    p_source      => q'[
      SELECT d.content_type,
             d.file_content
      FROM   hr.documents d
      WHERE  d.employee_id = :employee_id
      AND    d.filename    = :filename
    ]'
  );
  COMMIT;
END;
/
```

ORDS automatically:
- Sets the `Content-Type` header from the first selected column
- Streams the BLOB body from the second selected column
- Returns 404 if the query returns no rows

Example download:

```shell
# Download a document
curl --output resume.pdf \
  https://myserver.example.com/ords/hr/docs/employees/101/documents/resume.pdf/content \
  -H "Authorization: Bearer <token>"
```

Pick the output filename on the client side unless you have separate, documented header handling for attachment filenames.

### Using `source_type_media` for Generated Downloads

Current ORDS documentation describes `source_type_plsql` as a handler source type for `DELETE`, `PUT`, and `POST`, not `GET`. For generated downloads, keep the handler on `source_type_media` and return the media type first and the generated representation second.

```sql
ORDS.DEFINE_HANDLER(
  p_module_name => 'hr.docs',
  p_pattern     => 'employees/:employee_id/documents/:filename/download',
  p_method      => 'GET',
  p_source_type => ORDS.source_type_media,
  p_source      => q'[
    SELECT d.content_type,
           hr.docs_pkg.render_download_blob(
             p_employee_id => :employee_id,
             p_filename    => :filename
           )
    FROM   hr.documents d
    WHERE  d.employee_id = :employee_id
    AND    d.filename    = :filename
  ]'
);
```

If you need to transform the payload before download, do that work in SQL or in a PL/SQL function called from the `SELECT`, then return the final media type and BLOB through `source_type_media`.

---

## Listing Documents (Metadata Without Content)

```sql
ORDS.DEFINE_TEMPLATE(
  p_module_name => 'hr.docs',
  p_pattern     => 'employees/:employee_id/documents/'
);

ORDS.DEFINE_HANDLER(
  p_module_name    => 'hr.docs',
  p_pattern        => 'employees/:employee_id/documents/',
  p_method         => 'GET',
  p_source_type    => ORDS.source_type_collection_feed,
  p_items_per_page => 25,
  p_source         => q'[
    SELECT d.document_id,
           d.filename,
           d.content_type,
           d.file_size,
           d.description,
           d.uploaded_by,
           d.upload_date,
           -- Construct a relative link to the child download resource
           './' || UTL_URL.ESCAPE(d.filename, TRUE, 'UTF-8')
             || '/content' AS download_url
    FROM   hr.documents d
    WHERE  d.employee_id = :employee_id
    ORDER  BY d.upload_date DESC
  ]'
);
```

---

## MIME Type Handling

Store MIME types in the database alongside the blob. Map file extensions to MIME types during upload:

```sql
CREATE OR REPLACE FUNCTION hr.get_mime_type(p_filename IN VARCHAR2) RETURN VARCHAR2 AS
  l_ext VARCHAR2(20);
BEGIN
  l_ext := LOWER(SUBSTR(p_filename, INSTR(p_filename, '.', -1) + 1));

  RETURN CASE l_ext
    WHEN 'pdf'  THEN 'application/pdf'
    WHEN 'doc'  THEN 'application/msword'
    WHEN 'docx' THEN 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    WHEN 'xls'  THEN 'application/vnd.ms-excel'
    WHEN 'xlsx' THEN 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    WHEN 'jpg'  THEN 'image/jpeg'
    WHEN 'jpeg' THEN 'image/jpeg'
    WHEN 'png'  THEN 'image/png'
    WHEN 'gif'  THEN 'image/gif'
    WHEN 'txt'  THEN 'text/plain'
    WHEN 'csv'  THEN 'text/csv'
    WHEN 'json' THEN 'application/json'
    WHEN 'xml'  THEN 'application/xml'
    WHEN 'zip'  THEN 'application/zip'
    ELSE 'application/octet-stream'
  END;
END;
/
```

In the upload handler, use the client-provided Content-Type but fall back to filename-based detection:

```sql
l_mime := NVL(
  NULLIF(:content_type, 'application/octet-stream'),
  hr.get_mime_type(:filename)
);
```

---

## Content-Disposition: Inline vs Attachment

Control whether browsers display files inline or prompt for download:

```sql
-- For images and PDFs (display inline in browser)
HTP.P('Content-Disposition: inline; filename="' || l_filename || '"');

-- For all other files (force download)
HTP.P('Content-Disposition: attachment; filename="' || l_filename || '"');

-- RFC 5987 encoding for non-ASCII filenames
HTP.P('Content-Disposition: attachment; filename*=UTF-8'''' ||
      UTL_URL.ESCAPE(l_filename, TRUE, 'UTF-8'));
```

---

## Streaming Large Files

For files larger than available memory, prefer `source_type_media`. ORDS streams the LOB response body automatically, so the handler does not need to implement manual chunking in PL/SQL.

Large uploads are constrained by the ORDS runtime and fronting HTTP server, not by pagination settings such as `misc.pagination.maxRows`.

In Jetty standalone, review the request-size and JVM memory settings for the deployed ORDS runtime before accepting large files. For very large payloads, consider chunked upload (client splits the file, uploads parts, server assembles) instead of relying on a single request body.

---

## Deleting Documents

```sql
ORDS.DEFINE_HANDLER(
  p_module_name => 'hr.docs',
  p_pattern     => 'employees/:employee_id/documents/:filename',
  p_method      => 'DELETE',
  p_source_type => ORDS.source_type_plsql,
  p_source      => q'[
    BEGIN
      DELETE FROM hr.documents
      WHERE  employee_id = :employee_id
      AND    filename    = :filename;

      IF SQL%ROWCOUNT = 0 THEN
        :status_code := 404;
      ELSE
        COMMIT;
        :status_code := 204;  -- No Content
      END IF;
    END;
  ]'
);
```

---

## Best Practices

- **Use `source_type_media` for downloads when possible**: It is the cleanest, most efficient approach. ORDS handles all streaming and header management automatically.
- **Always validate file size before storing**: Copy `:body` into a local `BLOB`, then check `DBMS_LOB.GETLENGTH` on that variable before reusing it in DML. Return 413 (Payload Too Large) for oversized uploads.
- **Store MIME type in the database**: Do not rely solely on file extension at download time. Store the `Content-Type` from the upload request and use it at download time.
- **Use SECUREFILE LOB storage**: SECUREFILE provides compression, deduplication, and encryption for LOB columns. Significantly more efficient than BASICFILE for large-scale file storage.
- **Set appropriate caching headers**: For static content (logos, PDFs) that rarely changes, add `Cache-Control: max-age=86400`. For dynamic documents, use `Cache-Control: private, no-cache`.
- **Restrict allowed file types**: Validate `content_type` against an allowlist during upload. Reject dangerous types (`application/x-executable`, `text/html` for user-uploaded content).

## Common Mistakes

- **Using `:body_text` for binary files**: Binary data (images, PDFs) must use `:body` (BLOB). Using `:body_text` (CLOB) for binary data corrupts the content due to character set conversion.
- **Dereferencing `:body` or `:body_text` multiple times**: Read the implicit payload bind into a local variable first. If you call `DBMS_LOB.GETLENGTH(:body)` and then reuse `:body` later, the later read can be empty.
- **Not setting `Content-Type` on download**: Without a Content-Type header, browsers guess the type and may display the wrong viewer or prompt the wrong application to open the file.
- **Forgetting COMMIT in upload handlers**: PL/SQL handlers do not auto-commit. An INSERT/UPDATE of a BLOB without COMMIT leaves the row locked and the data not visible to other sessions.
- **Loading entire BLOB into memory**: `SELECT file_content INTO l_blob FROM ...` loads the full BLOB pointer, but actual data is not fully read until accessed. Use `DBMS_LOB.READ` in a loop for large files to avoid OOM errors.
- **Encoding filenames with special characters in headers**: Filenames with spaces, accents, or non-ASCII characters in Content-Disposition headers must be RFC 5987 encoded. Plain `filename="résumé.pdf"` will be garbled in some clients.
- **Using BASICFILE LOB for new tables**: BASICFILE is legacy. Always specify `STORE AS SECUREFILE` for BLOB columns in new tables to benefit from better performance and storage options.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [ORDS Developer's Guide — Handling BLOBs and Binary Data](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/25.4/orddg/developing-REST-applications.html)
- [Oracle Database SecureFiles and Large Objects Developer's Guide 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/adlob/index.html)
- [ORDS Implicit Parameters Reference (:body, :content_type)](https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/25.4/orddg/implicit-parameters.html)
