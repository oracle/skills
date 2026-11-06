---
templateId: shared-components.rest-data-sources.example-rest-data-source.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Example Rest Data Source Example

## Purpose

Snippet class: `metavariable_template`.

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract. Bind every `{{...}}` variable from discovered REST data-profile metadata, schema evidence, user input, or compiler-backed truth before emitting APEXlang.

## Example

```apexlang
/*Acceptance and usage notes 
    - the below mentioned dataprofile is only for reference and a REST Data source can have more columns in the data profile. Hence sure to discover the entire data profile with child level hierarchy by making a call to the REST API configured under rest-data-sources */
/*Use the below for GET operation*/
    restDataSource http_paginated_records_example (
    name: Objects
    source {
        type: http
        remoteServer: @sample-rest-api
        urlPathPrefix: /data/Pagination
    }
    /*STRICTLY - Use this ONLY when asked to do Synchronization to local table with Synchronization type as 'append' */    
    synchronization {
        jobIsActive: true
        localTableOwner: SAN
        localTableName: {{source.table}}
        schedule: FREQ=DAILY;INTERVAL=1;BYHOUR=1;BYMINUTE=5;BYSECOND=10
        httpRequestLimit: 1000
    }
    /*STRICTLY - Use this ONLY when asked to do Synchronization to local table with Synchronization type as 'merge' */    
      synchronization {
        jobIsActive: true
        localTableOwner: SAN
        localTableName: {{source.table}}
        type: merge
        schedule: FREQ=HOURLY;INTERVAL=3;BYMINUTE=20;BYSECOND=10
        httpRequestLimit: 1000
    }
     /*STRICTLY - Use this ONLY when asked to do Synchronization to local table with Synchronization type as 'replace' or 'fullRefreshDelete' */    
     synchronization {
        jobIsActive: true
        localTableOwner: SAN
        localTableName: {{source.table}}
        type: fullRefreshDelete
        schedule: FREQ=DAILY;INTERVAL=2;BYHOUR=10;BYMINUTE=05;BYSECOND=20
        httpRequestLimit: 1000
    }
    /*STRICTLY - Use this ONLY when Synchronization RateLimit is required */    
    synchronizationRateLimit {
        timeframe: 50   
        httpRequests: 100
    }
    authentication {
        credentials: @moviedb_api_key
    }
    comments {
        comments: Confirm pagination settings with compiler-backed REST Data Source attributes before emission.
    }

    parameter search_query (
        name: query
        parameter {
            type: urlQueryString
        }
        advanced {
            useForRowSearch: true
        }
    )

    parameter name (
        name: name
    )
    
    dataProfile {
        name: HTTP_PAGINATED_RECORDS_EXAMPLE
        rowSelector: items
    }

    dataProfileColumn data (
        columnName: DATA
        source {
            sequence: 1
            dataType: varchar2
        }
        parsing {
            pathExpression: data
        }
        advanced {
            sourceDataType: null
        }
    )

    dataProfileColumn data-capacity (
        columnName: DATA_CAPACITY
        source {
            sequence: 2
            dataType: varchar2
        }
        parsing {
            pathExpression: data.Capacity
        }
        advanced {
            sourceDataType: string
        }
    )

    dataProfileColumn data-hard-disk-size (
        columnName: DATA_HARD_DISK_SIZE
        source {
            sequence: 3
            dataType: varchar2
        }
        parsing {
            pathExpression: "data."Hard disk size""
        }
        advanced {
            sourceDataType: string
        }
    )
    
    dataProfileColumn data-capacity-gb (
        columnName: DATA_CAPACITY_GB
        source {
            sequence: 4
            dataType: number
        }
        parsing {
            pathExpression: "data."capacity GB""
        }
        advanced {
            sourceDataType: number
        }
    )

    dataProfileColumn ID (
        columnName: ID
        source {
            sequence: 5
            dataType: number
            primaryKey: true
        }
        parsing {
            pathExpression: id
        }
        
        advanced {
            sourceDataType: number
        }
    )

    dataProfileColumn NAME (
        columnName: NAME
        source {
            sequence: 6
            dataType: varchar2
        }
        parsing {
            pathExpression: name
        }
        
        advanced {
            sourceDataType: string
        }
    )

    dataProfileColumn {{source.dateColumn}} (
        columnName: {{source.dateColumn}}
        source {
            sequence: 7
            dataType: timestampWithTimeZone
        }
        parsing {
            pathExpression: {{source.dateJsonPath}}
            formatMask: YYYY"-"MM"-"DD"T"HH24":"MI:SS.FF9TZR
        }
        
        advanced {
            sourceDataType: string
        }
    )

    dataProfileColumn {{source.amountColumn}} (
        columnName: {{source.amountColumn}}
        source {
            sequence: 8
            dataType: number
        }
        parsing {
            pathExpression: {{source.amountJsonPath}}
        }
       
        advanced {
            sourceDataType: number
        }
    )

    operation get_rows (
        label: GET
        operation {
            urlPattern: .
            httpMethod: get
            databaseOperation: fetchRows
        }
        advanced {
            fixedPageSize: 20
        }
    )

)

/*Use the below for POST operation*/

restDataSource icm-claims-data (
    name: ICM Claims Data
    source {
        type: ords
        remoteServer: @ph-apex
        urlPathPrefix: /icm_claims/
    }

    parameter claim-id (
        name: CLAIM_ID
        operation: @post
        parameter {
            type: requestOrResponseBody
        }
    )

    parameter claim-number (
        name: CLAIM_NUMBER
        operation: @post
        parameter {
            type: requestOrResponseBody
        }
    )

    parameter currency-code (
        name: CURRENCY_CODE
        operation: @post
        parameter {
            type: requestOrResponseBody
        }
    )

    parameter policy-id (
        name: POLICY_ID
        operation: @post
        parameter {
            type: requestOrResponseBody
        }
    )

    parameter reported-date (
        name: REPORTED_DATE
        operation: @post
        parameter {
            type: requestOrResponseBody
        }
    )

    parameter total-claimed-amount (
        name: TOTAL_CLAIMED_AMOUNT
        operation: @post
        parameter {
            type: requestOrResponseBody
        }
    )

    dataProfile {
        name: ICM Claims Data
        rowSelector: items
    }

    dataProfileColumn claim-id (
        columnName: CLAIM_ID
        source {
            sequence: 1
            dataType: number
        }
        parsing {
            pathExpression: claim_id
        }
    )

    dataProfileColumn claim-number (
        columnName: CLAIM_NUMBER
        source {
            sequence: 3
            dataType: varchar2
        }
        parsing {
            pathExpression: claim_number
        }
    )

    dataProfileColumn currency-code (
        columnName: CURRENCY_CODE
        source {
            sequence: 6
            dataType: varchar2
        }
        parsing {
            pathExpression: currency_code
        }
    )

    dataProfileColumn policy-id (
        columnName: POLICY_ID
        source {
            sequence: 2
            dataType: number
        }
        parsing {
            pathExpression: policy_id
        }
    )

    dataProfileColumn reported-date (
        columnName: REPORTED_DATE
        source {
            sequence: 4
            dataType: date
        }
        parsing {
            pathExpression: reported_date
        }
    )

    dataProfileColumn total-claimed-amount (
        columnName: TOTAL_CLAIMED_AMOUNT
        source {
            sequence: 5
            dataType: number
        }
        parsing {
            pathExpression: total_claimed_amount
        }
    )

    operation get (
        label: GET
        operation {
            urlPattern: .
            httpMethod: get
            databaseOperation: fetchRows
        }
    )

    operation post (
        label: POST
        operation {
            urlPattern: .
            httpMethod: post
            databaseOperation: insert
        }
        requestBody {
            template:
                ```
                {
                    "claim_id":"#CLAIM_ID#"
                   ,"policy_id":"#POLICY_ID#"
                   ,"claim_number":"#CLAIM_NUMBER#"
                   ,"reported_date":"#REPORTED_DATE#"
                   ,"total_claimed_amount":"#TOTAL_CLAIMED_AMOUNT#"
                   ,"currency_code":"#CURRENCY_CODE#"
                }
                ```
            versionNumber: 1
        }
    )

)
```
