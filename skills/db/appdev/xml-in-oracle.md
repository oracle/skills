# XML in Oracle Database

## Overview

Oracle has provided native XML support since Oracle 9i through the `XMLType` data type and the Oracle XML DB (XMLDB) component. Oracle's XML capabilities span storage, querying with XQuery and XPath, generation, transformation, and indexing. While JSON has largely displaced XML for new application development, XML remains essential for:

- EDI, HIPAA, and government data exchange standards
- SOAP web service integration
- Legacy system interfaces
- Document management and content repositories
- Configuration storage

---

## XMLType Storage Options

Oracle XMLType can be stored in three distinct internal formats, each with different performance trade-offs.

### 1. Object-Relational Storage (Schema-Registered XML)

Best for: Highly structured, frequently queried XML with a stable, known schema. Oracle maps XML elements to relational columns internally, enabling fast XPath navigation.

```sql
-- Register an XML schema
BEGIN
    DBMS_XMLSCHEMA.REGISTER_SCHEMA(
        SCHEMAURL => 'http://myapp.com/schemas/order.xsd',
        SCHEMADOC => XMLTYPE(
            '<?xml version="1.0"?>
             <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
                        targetNamespace="http://myapp.com/schemas/order">
               <xs:element name="Order">
                 <xs:complexType>
                   <xs:sequence>
                     <xs:element name="OrderId" type="xs:integer"/>
                     <xs:element name="CustomerName" type="xs:string"/>
                     <xs:element name="TotalAmount" type="xs:decimal"/>
                   </xs:sequence>
                 </xs:complexType>
               </xs:element>
             </xs:schema>'
        ),
        LOCAL => TRUE,
        GENTYPES => TRUE,
        GENBEAN => FALSE,
        GENTABLES => FALSE
    );
END;
/

-- Create table with schema-based XMLType
CREATE TABLE orders_xml (
    order_id   NUMBER PRIMARY KEY,
    order_doc  XMLType
)
XMLTYPE COLUMN order_doc STORE AS OBJECT RELATIONAL
    XMLSCHEMA "http://myapp.com/schemas/order.xsd"
    ELEMENT "Order";
```

### 2. CLOB Storage (Unstructured XML)

Best for: Variable-structure XML, XML you mainly store and retrieve whole, legacy data. Simplest to set up.

```sql
-- XMLType stored as CLOB (unstructured)
CREATE TABLE contracts (
    contract_id   NUMBER PRIMARY KEY,
    contract_xml  XMLType
)
XMLTYPE COLUMN contract_xml STORE AS CLOB;

-- Insert XML
INSERT INTO contracts VALUES (
    1,
    XMLType('<Contract>
               <ContractId>1001</ContractId>
               <Parties>
                 <Party role="buyer">Acme Corp</Party>
                 <Party role="seller">Beta LLC</Party>
               </Parties>
               <EffectiveDate>2025-01-01</EffectiveDate>
               <Value currency="USD">50000</Value>
             </Contract>')
);

-- Or from a string variable
DECLARE
    v_xml CLOB := '<Contract><ContractId>1002</ContractId></Contract>';
BEGIN
    INSERT INTO contracts VALUES (1002, XMLType(v_xml));
    COMMIT;
END;
```

### 3. Binary XML Storage (Recommended for 11g+)

Best for: General-purpose XML storage without schema registration. Stores in a compact binary post-parse format (similar to conceptual approach as JSON's OSON). Faster than CLOB, simpler than object-relational.

```sql
CREATE TABLE product_specs (
    product_id  NUMBER PRIMARY KEY,
    spec_xml    XMLType
)
XMLTYPE COLUMN spec_xml STORE AS BINARY XML;

-- Insert XML
INSERT INTO product_specs VALUES (
    101,
    XMLType('<Specification>
               <ProductId>101</ProductId>
               <Name>Industrial Widget</Name>
               <Dimensions unit="mm">
                 <Width>150</Width>
                 <Height>75</Height>
                 <Depth>50</Depth>
               </Dimensions>
               <Materials>
                 <Material>Steel</Material>
                 <Material>Rubber</Material>
               </Materials>
             </Specification>')
);
```

---

## XPath Extraction with XMLType Methods

```sql
-- Extract a single node value using XPath
SELECT EXTRACTVALUE(spec_xml, '/Specification/Name') AS product_name
FROM   product_specs;

-- Extract an XML fragment (returns XMLType)
SELECT EXTRACT(spec_xml, '/Specification/Dimensions') AS dimensions_xml
FROM   product_specs;

-- existsNode: test for node existence
SELECT product_id
FROM   product_specs
WHERE  EXISTSNODE(spec_xml, '/Specification/Materials/Material[text()="Steel"]') = 1;

-- XMLQuery: XQuery evaluation returning XMLType
SELECT XMLQuery('$x/Specification/Name/text()'
                PASSING spec_xml AS "x"
                RETURNING CONTENT) AS name_value
FROM   product_specs;
```

Note: `EXTRACTVALUE`, `EXTRACT`, and `EXISTSNODE` are deprecated in 11g+. Prefer `XMLQUERY`, `XMLEXISTS`, and `XMLTABLE`.

---

## XMLTable: Shredding XML into Relational Rows

`XMLTable` is the modern, recommended way to convert XML documents into relational data. It uses XQuery path expressions to navigate the document.

```sql
-- Basic XMLTable usage
SELECT x.product_id_val, x.product_name, x.width, x.height
FROM   product_specs p,
       XMLTable('/Specification'
           PASSING p.spec_xml
           COLUMNS
               product_id_val  NUMBER         PATH 'ProductId',
               product_name    VARCHAR2(200)  PATH 'Name',
               width           NUMBER         PATH 'Dimensions/Width',
               height          NUMBER         PATH 'Dimensions/Height'
       ) x;

-- Expand repeating elements (array-like)
SELECT p.product_id, m.material_name
FROM   product_specs p,
       XMLTable('/Specification/Materials/Material'
           PASSING p.spec_xml
           COLUMNS
               material_name  VARCHAR2(100)  PATH '.'
       ) m;

-- Extract attribute values
SELECT x.currency, x.value
FROM   contracts c,
       XMLTable('/Contract/Value'
           PASSING c.contract_xml
           COLUMNS
               currency  VARCHAR2(3)     PATH '@currency',  -- @ for attributes
               value     NUMBER(15,2)    PATH '.'
       ) x;

-- Nested XMLTable for hierarchical data
SELECT p.product_id, outer_x.dim_unit, inner_x.dim_name, inner_x.dim_value
FROM   product_specs p,
       XMLTable('/Specification/Dimensions'
           PASSING p.spec_xml
           COLUMNS
               dim_unit  VARCHAR2(10)  PATH '@unit',
               dim_xml   XMLType       PATH '.'
       ) outer_x,
       XMLTable('/*'
           PASSING outer_x.dim_xml
           COLUMNS
               dim_name   VARCHAR2(50)  PATH 'fn:name(.)',
               dim_value  NUMBER        PATH '.'
       ) inner_x;
```

### XMLTable with Namespaces

```sql
-- XML with namespace declarations
SELECT x.order_id, x.customer
FROM   XMLTable(
           XMLNAMESPACES('http://orders.example.com' AS "ord"),
           '/ord:OrderSet/ord:Order'
           PASSING XMLType(
               '<OrderSet xmlns="http://orders.example.com">
                  <Order><OrderId>1</OrderId><Customer>Acme</Customer></Order>
                  <Order><OrderId>2</OrderId><Customer>Beta</Customer></Order>
                </OrderSet>'
           )
           COLUMNS
               order_id  NUMBER        PATH 'ord:OrderId',
               customer  VARCHAR2(100) PATH 'ord:Customer'
       ) x;
```

---

## Generating XML: XMLElement, XMLForest, XMLAgg

Oracle provides functions to generate XML from relational data.

```sql
-- XMLElement: create an XML element from a value
SELECT XMLElement("Employee",
           XMLElement("Name", first_name || ' ' || last_name),
           XMLElement("Department", department_id),
           XMLElement("Salary", salary)
       ).getClobVal() AS employee_xml
FROM   employees
WHERE  department_id = 10;

-- XMLForest: create a sequence of elements from columns
SELECT XMLElement("Employee",
           XMLForest(
               employee_id AS "Id",
               first_name  AS "FirstName",
               last_name   AS "LastName",
               hire_date   AS "HireDate"
           )
       ).getClobVal() AS emp_xml
FROM   employees;

-- XMLAttributes: add attributes to an element
SELECT XMLElement("Product",
           XMLAttributes(
               product_id AS "id",
               'active'   AS "status"
           ),
           XMLForest(
               product_name AS "Name",
               list_price   AS "Price"
           )
       ).getClobVal() AS product_xml
FROM   products;

-- XMLAgg: aggregate multiple XML elements into one parent
SELECT XMLElement("Department",
           XMLAttributes(department_id AS "id"),
           XMLAgg(
               XMLElement("Employee",
                   XMLForest(
                       employee_id AS "Id",
                       first_name  AS "Name"
                   )
               )
               ORDER BY last_name
           )
       ).getClobVal() AS dept_xml
FROM   employees
GROUP  BY department_id;
```

### XMLRoot and XMLDocument

```sql
-- Add XML declaration and root element
SELECT XMLRoot(
           XMLElement("Employees",
               XMLAgg(XMLElement("Employee", first_name || ' ' || last_name))
           ),
           VERSION '1.0',
           STANDALONE YES
       ).getClobVal() AS xml_doc
FROM   employees;
```

---

## XQuery with XMLQuery and XMLExists

```sql
-- XMLQuery: execute XQuery expression, return XMLType
SELECT XMLQuery(
           'for $o in /OrderSet/Order
            where $o/Status = "PENDING"
            return $o/OrderId'
           PASSING order_xml
           RETURNING CONTENT
       ).getStringVal() AS pending_ids
FROM   order_documents;

-- XMLExists: test with XQuery predicate
SELECT order_id
FROM   order_documents
WHERE  XMLExists(
           'for $o in /Order/Items/Item
            where $o/Price > 100
            return $o'
           PASSING order_xml
       );

-- XQuery FLWOR expression
SELECT XMLQuery(
           'for $i in /Specification/Materials/Material
            order by $i
            return <mat>{$i/text()}</mat>'
           PASSING spec_xml
           RETURNING CONTENT
       ).getClobVal() AS sorted_materials
FROM   product_specs
WHERE  product_id = 101;
```

---

## XML Indexes

### XMLIndex (Structured and Unstructured)

```sql
-- Unstructured XMLIndex: indexes all text nodes and attribute values
CREATE INDEX idx_contracts_xml
    ON contracts (contract_xml)
    INDEXTYPE IS XDB.XMLIndex;

-- Structured XMLIndex: index specific paths for targeted performance
CREATE INDEX idx_contracts_structured
    ON contracts (contract_xml)
    INDEXTYPE IS XDB.XMLIndex
    PARAMETERS ('PATHS (
        path (/Contract/ContractId)
        path (/Contract/EffectiveDate)
        path (/Contract/Value)
    )');

-- Drop XML index
DROP INDEX idx_contracts_xml;
```

### Function-Based Index for Common XPath

```sql
-- When you always query a specific scalar path
CREATE INDEX idx_spec_product_name
    ON product_specs (
        XMLCast(XMLQuery('/Specification/Name/text()'
                         PASSING spec_xml RETURNING CONTENT)
                AS VARCHAR2(200))
    );

-- Query using the same expression to leverage the index
SELECT product_id
FROM   product_specs
WHERE  XMLCast(XMLQuery('/Specification/Name/text()'
                        PASSING spec_xml RETURNING CONTENT)
               AS VARCHAR2(200)) = 'Industrial Widget';
```

---

## Oracle XML DB (XMLDB) Repository

XMLDB includes a hierarchical repository accessible via WebDAV or FTP protocols, allowing XML documents to be stored in a folder-like structure within the database.

```sql
-- Create a folder in the XMLDB repository
CALL DBMS_XDB.CREATEFOLDER('/public/contracts');

-- Create/store an XML resource
DECLARE
    v_result BOOLEAN;
BEGIN
    v_result := DBMS_XDB.CREATERESOURCE(
        ABSPATH => '/public/contracts/contract_1001.xml',
        DATA    => XMLTYPE(
            '<Contract>
               <ContractId>1001</ContractId>
               <Status>Active</Status>
             </Contract>'
        )
    );
    IF NOT v_result THEN
        RAISE_APPLICATION_ERROR(-20001, 'Resource already exists');
    END IF;
    COMMIT;
END;

-- Query XML files in the repository using RESOURCE_VIEW
SELECT PATH(1) AS file_path, XMLType(RES) AS resource_xml
FROM   RESOURCE_VIEW
WHERE  UNDER_PATH(RES, '/public/contracts', 1) = 1;

-- Query content from repository documents
SELECT x.contract_id, x.status
FROM   RESOURCE_VIEW rv,
       XMLTable('/Contract'
           PASSING XMLType(rv.RES)
           COLUMNS
               contract_id  NUMBER        PATH 'ContractId',
               status       VARCHAR2(20)  PATH 'Status'
       ) x
WHERE  UNDER_PATH(rv.RES, '/public/contracts', 1) = 1;
```

---

## XML Type Conversions and Utilities

```sql
-- Convert XMLType to CLOB
SELECT spec_xml.getClobVal() AS xml_clob FROM product_specs;

-- Convert XMLType to VARCHAR2 (if small enough)
SELECT spec_xml.getStringVal() AS xml_string FROM product_specs WHERE product_id = 101;

-- Convert VARCHAR2/CLOB to XMLType
SELECT XMLType('<root><value>42</value></root>') AS xml_val FROM DUAL;

-- Validate XML against a registered schema
SELECT spec_xml.isSchemaValid('http://myapp.com/schemas/product.xsd') AS is_valid
FROM   product_specs;

-- Transform with XSLT
SELECT XMLType('<data><item>Hello</item></data>').transform(
    XMLType('<?xml version="1.0"?>
             <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
               <xsl:template match="/">
                 <result><xsl:value-of select="/data/item"/></result>
               </xsl:template>
             </xsl:stylesheet>')
).getClobVal() AS transformed
FROM   DUAL;

-- Pretty-print XML
SELECT XMLSerialize(DOCUMENT spec_xml INDENT SIZE = 2) AS formatted_xml
FROM   product_specs;
```

---

## Best Practices

- **Choose Binary XML storage** (not CLOB, not object-relational) for new XMLType columns unless you have a specific reason for the alternatives. Binary XML offers the best balance of storage efficiency, query performance, and flexibility.
- **Use XMLTable and XMLQuery** (not deprecated EXTRACTVALUE/EXTRACT) for all new development.
- **Index specific XPath expressions** with structured XMLIndex or function-based indexes for frequently queried paths.
- **Avoid fetching entire XML documents to application code** to extract one field. Use XMLTable/XMLQuery to shred at the database level.
- **Use XMLSerialize** for controlled serialization when generating XML output — it handles encoding, indentation, and namespace declarations correctly.
- **For large XML documents (>1MB)**, consider CLOB storage and process with `DBMS_XMLPARSER` streaming API rather than loading entire documents into memory.
- **Validate XML on insert** using schema registration or `IS JSON` equivalent (`XMLTYPE ... VALIDATING`) to catch structure errors early.

---

## Common Mistakes

### Mistake 1: Using Deprecated Functions

```sql
-- DEPRECATED: avoid in new code
SELECT EXTRACTVALUE(xml_col, '/Root/Value') FROM t;
SELECT EXTRACT(xml_col, '/Root/Child') FROM t;

-- PREFERRED
SELECT XMLCast(XMLQuery('/Root/Value/text()' PASSING xml_col RETURNING CONTENT) AS VARCHAR2(100)) FROM t;
SELECT XMLQuery('/Root/Child' PASSING xml_col RETURNING CONTENT) FROM t;
```

### Mistake 2: CLOB Storage for Frequently Queried XML

Storing as CLOB means every XPath query must parse the document from scratch. For XML that is queried often, use Binary XML or Object-Relational with an XMLIndex.

### Mistake 3: No Namespace Handling

Forgetting to declare namespaces in XMLTable/XMLQuery causes silent empty result sets — Oracle returns no rows instead of an error when namespace-qualified paths don't match.

```sql
-- WRONG: ignores namespace, returns nothing
SELECT * FROM XMLTable('/Order/Id' PASSING namespace_xml_col COLUMNS id NUMBER PATH '.');

-- RIGHT: declare the namespace
SELECT * FROM XMLTable(
    XMLNAMESPACES('http://orders.com/v1' AS "o"),
    '/o:Order/o:Id'
    PASSING namespace_xml_col
    COLUMNS id NUMBER PATH '.'
);
```

### Mistake 4: Comparing XMLType with =

XMLType cannot be compared with `=`. Use XMLExists, XMLQuery, or extract a scalar value first.

```sql
-- WRONG
WHERE spec_xml = XMLType('<Specification>...')

-- RIGHT: compare extracted values
WHERE XMLCast(XMLQuery('/Specification/ProductId/text()'
                       PASSING spec_xml RETURNING CONTENT) AS NUMBER) = 101
```

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c XML Developer's Kit Programmer's Guide (ADXDK)](https://docs.oracle.com/en/database/oracle/oracle-database/19/adxdk/)
- [Oracle Database 19c SQL Language Reference — XML Functions](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/)
- [Oracle XML DB Developer's Guide (ADXDB)](https://docs.oracle.com/en/database/oracle/oracle-database/19/adxdb/)
