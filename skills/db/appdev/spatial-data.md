# Spatial Data in Oracle Database

## Overview

Oracle Spatial and Graph (formerly Oracle Spatial) provides a native spatial data type, geometry operators, and spatial indexing within the Oracle Database. It is fully integrated with SQL, enabling spatial queries to participate in joins, aggregations, and query optimizations alongside standard relational data.

Oracle Spatial is built on the `MDSYS` schema and requires the Oracle Spatial option (included in Enterprise Edition; also available in Standard Edition 2 in recent versions as a subset). Oracle's spatial capabilities conform to the **OGC (Open Geospatial Consortium) Simple Features for SQL** standard.

---

## The SDO_GEOMETRY Type

All spatial data in Oracle is stored using the `SDO_GEOMETRY` object type, defined in the `MDSYS` schema.

### SDO_GEOMETRY Structure

```sql
-- Definition of SDO_GEOMETRY (conceptual; defined by MDSYS)
CREATE TYPE sdo_geometry AS OBJECT (
    sdo_gtype   NUMBER,      -- geometry type code
    sdo_srid    NUMBER,      -- coordinate reference system (EPSG code)
    sdo_point   SDO_POINT_TYPE,   -- shortcut for 2D/3D point types
    sdo_elem_info SDO_ELEM_INFO_ARRAY,  -- element description array
    sdo_ordinates SDO_ORDINATE_ARRAY    -- packed coordinate array
);
```

### SDO_GTYPE: Geometry Type Codes

The `SDO_GTYPE` is a 4-digit code: **DLTT**
- **D**: number of dimensions (2, 3, 4)
- **L**: LRS (Linear Reference System) measure dimension (0 if none)
- **TT**: geometry type (01–07)

| GTYPE | Description |
|---|---|
| 2001 | 2D Point |
| 3001 | 3D Point |
| 2002 | 2D Line String (polyline) |
| 2003 | 2D Polygon |
| 3003 | 3D Polygon |
| 2004 | 2D Geometry Collection |
| 2005 | 2D MultiPoint |
| 2006 | 2D MultiLine |
| 2007 | 2D MultiPolygon |

---

## Common Geometry Subtypes

### Point

```sql
-- 2D Point using SDO_POINT (fastest/simplest for point data)
-- Format: SDO_GEOMETRY(gtype, srid, SDO_POINT_TYPE(x, y, z_or_null), null, null)
SELECT SDO_GEOMETRY(
    2001,                           -- 2D Point
    4326,                           -- WGS84 coordinate system (GPS)
    SDO_POINT_TYPE(-122.4194, 37.7749, NULL),  -- San Francisco (lon, lat)
    NULL,
    NULL
) AS sf_location
FROM DUAL;

-- 3D Point
SELECT SDO_GEOMETRY(
    3001,            -- 3D Point
    4326,
    SDO_POINT_TYPE(-122.4194, 37.7749, 52.0),  -- with elevation in meters
    NULL,
    NULL
) FROM DUAL;
```

### Line String

```sql
-- 2D LineString (a route or road segment)
-- SDO_ELEM_INFO: (starting_offset, etype, interpretation)
--   etype 2 = line string, interpretation 1 = straight segments
SELECT SDO_GEOMETRY(
    2002,           -- 2D LineString
    4326,           -- WGS84
    NULL,
    SDO_ELEM_INFO_ARRAY(1, 2, 1),                -- one line string, straight segments
    SDO_ORDINATE_ARRAY(
        -122.4194, 37.7749,   -- point 1 (start)
        -122.4094, 37.7849,   -- point 2
        -122.3994, 37.7749    -- point 3 (end)
    )
) AS route
FROM DUAL;
```

### Polygon

```sql
-- Simple 2D Polygon (closed ring, last point = first point)
-- etype 1003 = exterior polygon ring, interpretation 1 = straight segments
SELECT SDO_GEOMETRY(
    2003,           -- 2D Polygon
    4326,
    NULL,
    SDO_ELEM_INFO_ARRAY(1, 1003, 1),    -- exterior ring, straight segments
    SDO_ORDINATE_ARRAY(
        -122.45, 37.75,   -- SW corner
        -122.40, 37.75,   -- SE corner
        -122.40, 37.80,   -- NE corner
        -122.45, 37.80,   -- NW corner
        -122.45, 37.75    -- close ring (same as first point)
    )
) AS sf_district
FROM DUAL;

-- Polygon with a hole (donut shape)
SELECT SDO_GEOMETRY(
    2003,
    4326,
    NULL,
    SDO_ELEM_INFO_ARRAY(
        1, 1003, 1,   -- outer ring starts at ordinate position 1
        11, 2003, 1   -- inner ring (hole) starts at ordinate position 11
    ),
    SDO_ORDINATE_ARRAY(
        -- Outer ring (5 points = 10 ordinates)
        0, 0,  10, 0,  10, 10,  0, 10,  0, 0,
        -- Inner ring / hole (5 points = 10 ordinates)
        2, 2,   8, 2,   8,  8,  2,  8,  2, 2
    )
) AS donut_polygon
FROM DUAL;
```

---

## Setting Up Spatial Tables

### Create Table and Populate USER_SDO_GEOM_METADATA

**Every spatial table must have an entry in `USER_SDO_GEOM_METADATA`** before a spatial index can be created. This metadata defines the valid coordinate range.

```sql
-- Create the table
CREATE TABLE store_locations (
    store_id    NUMBER PRIMARY KEY,
    store_name  VARCHAR2(100),
    city        VARCHAR2(50),
    location    MDSYS.SDO_GEOMETRY
);

-- Register spatial metadata (REQUIRED before creating spatial index)
-- diminfo: array of dimension info: (name, min_val, max_val, tolerance)
-- tolerance: smallest meaningful distance in the coordinate units (degrees for WGS84)
INSERT INTO user_sdo_geom_metadata (table_name, column_name, diminfo, srid)
VALUES (
    'STORE_LOCATIONS',
    'LOCATION',
    SDO_DIM_ARRAY(
        SDO_DIM_ELEMENT('LONGITUDE', -180, 180, 0.00001),  -- ~1 meter in degrees
        SDO_DIM_ELEMENT('LATITUDE',   -90,  90, 0.00001)
    ),
    4326  -- WGS84 (GPS coordinates)
);
COMMIT;

-- Insert some sample stores
INSERT INTO store_locations VALUES (1, 'SF Downtown', 'San Francisco',
    SDO_GEOMETRY(2001, 4326, SDO_POINT_TYPE(-122.4194, 37.7749, NULL), NULL, NULL));

INSERT INTO store_locations VALUES (2, 'Oakland Uptown', 'Oakland',
    SDO_GEOMETRY(2001, 4326, SDO_POINT_TYPE(-122.2711, 37.8044, NULL), NULL, NULL));

INSERT INTO store_locations VALUES (3, 'San Jose Center', 'San Jose',
    SDO_GEOMETRY(2001, 4326, SDO_POINT_TYPE(-121.8863, 37.3382, NULL), NULL, NULL));

COMMIT;
```

---

## Spatial Indexes

Oracle's spatial index is an R-tree index (or quadtree for certain cases). It is created using the `INDEXTYPE IS MDSYS.SPATIAL_INDEX` syntax.

```sql
-- Create spatial index (must have metadata registered first)
CREATE INDEX idx_store_locations_geom
    ON store_locations (location)
    INDEXTYPE IS MDSYS.SPATIAL_INDEX
    PARAMETERS ('sdo_indx_dims=2');

-- For 3D spatial data
CREATE INDEX idx_buildings_3d
    ON buildings (geom_col)
    INDEXTYPE IS MDSYS.SPATIAL_INDEX_V2
    PARAMETERS ('sdo_indx_dims=3');

-- Verify index creation
SELECT index_name, status, ityp_owner, ityp_name
FROM   user_indexes
WHERE  table_name = 'STORE_LOCATIONS';
```

### Spatial Index Rebuild

```sql
-- Rebuild a spatial index (after bulk loads)
ALTER INDEX idx_store_locations_geom REBUILD;

-- Check spatial index validity
SELECT sdo_index_name, sdo_index_type, sdo_index_status
FROM   mdsys.sdo_index_info_table
WHERE  sdo_index_table_name = 'STORE_LOCATIONS';
```

---

## Spatial Operators

Oracle spatial uses **operators** (not functions) for primary spatial predicates. The optimizer uses these operators to leverage the spatial index.

### SDO_RELATE: General Topological Relationship

`SDO_RELATE` tests the topological relationship between two geometries using the 9-intersection model (DE-9IM).

```sql
-- Find all stores within a district boundary polygon
SELECT s.store_id, s.store_name
FROM   store_locations s,
       district_boundaries d
WHERE  d.district_name = 'Bay Area'
  AND  SDO_RELATE(
           s.location,          -- geometry 1 (indexed column)
           d.boundary,          -- geometry 2
           'mask=INSIDE'        -- relationship mask
       ) = 'TRUE';
```

**Relationship Masks:**

| Mask | Description |
|---|---|
| `TOUCH` | Boundaries touch, interiors don't intersect |
| `OVERLAPBDYDISJOINT` | Overlap with disjoint boundaries |
| `OVERLAPBDYINTERSECT` | Overlap with intersecting boundaries |
| `EQUAL` | Geometrically equal |
| `INSIDE` | Geometry 1 is inside geometry 2 |
| `COVEREDBY` | Geometry 1 is covered by (or inside) geometry 2 |
| `CONTAINS` | Geometry 1 contains geometry 2 |
| `COVERS` | Geometry 1 covers (or contains) geometry 2 |
| `ANYINTERACT` | Any interaction (most commonly used) |
| `ON` | Geometry 1 is on boundary of geometry 2 |

```sql
-- ANYINTERACT: find any geometries that touch, overlap, or contain each other
SELECT s.store_id, s.store_name
FROM   store_locations s,
       flood_zones f
WHERE  f.risk_level = 'HIGH'
  AND  SDO_RELATE(s.location, f.boundary, 'mask=ANYINTERACT') = 'TRUE';

-- Multiple masks combined with +
SELECT * FROM parcel_map p, utility_lines u
WHERE  SDO_RELATE(p.geom, u.geom, 'mask=TOUCH+OVERLAPBDYINTERSECT') = 'TRUE';
```

### SDO_WITHIN_DISTANCE: Proximity Search

```sql
-- Find stores within 5 km of a given point (e.g., customer location)
SELECT s.store_id, s.store_name, s.city
FROM   store_locations s
WHERE  SDO_WITHIN_DISTANCE(
           s.location,                                              -- indexed geometry
           SDO_GEOMETRY(2001, 4326,
               SDO_POINT_TYPE(-122.4000, 37.7700, NULL), NULL, NULL),  -- query point
           'distance=5 unit=km'                                     -- distance spec
       ) = 'TRUE';

-- Order results by actual distance
SELECT s.store_id, s.store_name,
       SDO_GEOM.SDO_DISTANCE(
           s.location,
           SDO_GEOMETRY(2001, 4326, SDO_POINT_TYPE(-122.4000, 37.7700, NULL), NULL, NULL),
           0.001,   -- tolerance
           'unit=km'
       ) AS distance_km
FROM   store_locations s
WHERE  SDO_WITHIN_DISTANCE(
           s.location,
           SDO_GEOMETRY(2001, 4326, SDO_POINT_TYPE(-122.4000, 37.7700, NULL), NULL, NULL),
           'distance=5 unit=km'
       ) = 'TRUE'
ORDER  BY distance_km;
```

### SDO_NN: Nearest Neighbor Search

```sql
-- Find the 3 nearest stores to a customer location
SELECT s.store_id, s.store_name,
       SDO_NN_DISTANCE(1) AS distance_meters
FROM   store_locations s
WHERE  SDO_NN(
           s.location,
           SDO_GEOMETRY(2001, 4326, SDO_POINT_TYPE(-122.4000, 37.7700, NULL), NULL, NULL),
           'sdo_num_res=3 unit=meter',
           1          -- correlation number (must match SDO_NN_DISTANCE argument)
       ) = 'TRUE'
ORDER  BY distance_meters;

-- SDO_NN with additional filter (stores that are open)
SELECT s.store_id, s.store_name, SDO_NN_DISTANCE(1) AS dist
FROM   store_locations s
WHERE  SDO_NN(s.location,
              SDO_GEOMETRY(2001, 4326, SDO_POINT_TYPE(-122.4, 37.77, NULL), NULL, NULL),
              'sdo_num_res=10', 1) = 'TRUE'
  AND  s.is_open = 'Y'
ORDER  BY dist
FETCH FIRST 3 ROWS ONLY;
```

### SDO_CONTAINS and SDO_INSIDE

```sql
-- Find all points inside a polygon
SELECT s.store_id, s.store_name
FROM   store_locations s,
       sales_territories t
WHERE  t.territory_id = 7
  AND  SDO_CONTAINS(t.boundary, s.location) = 'TRUE';

-- SDO_INSIDE: reverse of CONTAINS
SELECT t.territory_name
FROM   store_locations s,
       sales_territories t
WHERE  s.store_id = 42
  AND  SDO_INSIDE(s.location, t.boundary) = 'TRUE';
```

---

## SDO_GEOM Functions: Measurements and Operations

```sql
-- Calculate distance between two points
SELECT SDO_GEOM.SDO_DISTANCE(
    SDO_GEOMETRY(2001, 4326, SDO_POINT_TYPE(-122.4194, 37.7749, NULL), NULL, NULL),
    SDO_GEOMETRY(2001, 4326, SDO_POINT_TYPE(-118.2437, 34.0522, NULL), NULL, NULL),
    0.001,         -- tolerance
    'unit=km'
) AS sf_to_la_km
FROM DUAL;

-- Calculate area of a polygon
SELECT SDO_GEOM.SDO_AREA(
    SDO_GEOMETRY(
        2003, 4326, NULL,
        SDO_ELEM_INFO_ARRAY(1, 1003, 1),
        SDO_ORDINATE_ARRAY(-122.45, 37.75, -122.40, 37.75,
                           -122.40, 37.80, -122.45, 37.80, -122.45, 37.75)
    ),
    0.001,         -- tolerance
    'unit=sq_km'   -- square kilometers
) AS area_sq_km
FROM DUAL;

-- Calculate length/perimeter
SELECT SDO_GEOM.SDO_LENGTH(geom, 0.001, 'unit=km') AS length_km
FROM   road_segments
WHERE  road_id = 101;

-- Buffer: create a polygon at a fixed distance from a geometry
SELECT SDO_GEOM.SDO_BUFFER(
    location,
    5000,         -- 5000 meters
    0.001         -- tolerance
) AS five_km_buffer
FROM   store_locations
WHERE  store_id = 1;

-- Union of geometries
SELECT SDO_GEOM.SDO_UNION(geom_a, geom_b, 0.001) AS merged_geom
FROM   (SELECT a.boundary AS geom_a, b.boundary AS geom_b
        FROM   sales_territories a, sales_territories b
        WHERE  a.territory_id = 1 AND b.territory_id = 2);

-- Intersection
SELECT SDO_GEOM.SDO_INTERSECTION(
    polygon_a, polygon_b, 0.001
) AS intersection_geom
FROM   geometry_pairs;
```

---

## Coordinate Reference Systems (SRID)

The **SRID (Spatial Reference Identifier)** defines the coordinate system. Oracle stores the definitions in `MDSYS.SDO_COORD_REF_SYSTEM`.

```sql
-- Common SRIDs
-- 4326  = WGS84 (GPS, longitude/latitude in degrees) — most common
-- 3857  = Web Mercator (Google Maps, OpenStreetMap tiles) — projected, meters
-- 27700 = British National Grid (meters, UK)
-- 32610 = WGS84 / UTM Zone 10N (meters, western US)

-- Look up a coordinate system
SELECT srid, coord_ref_sys_name, coord_ref_sys_kind
FROM   mdsys.sdo_coord_ref_system
WHERE  srid IN (4326, 3857, 32610);

-- Convert between coordinate systems
SELECT SDO_CS.TRANSFORM(
    location,
    3857    -- convert from 4326 (WGS84) to 3857 (Web Mercator)
) AS location_web_mercator
FROM   store_locations
WHERE  store_id = 1;

-- Validate coordinate system of stored data
SELECT s.store_id, s.location.sdo_srid
FROM   store_locations s;
```

---

## GeoJSON Integration

```sql
-- Convert SDO_GEOMETRY to GeoJSON
SELECT SDO_UTIL.TO_GEOJSON(location) AS geojson
FROM   store_locations
WHERE  store_id = 1;
-- Returns: {"type":"Point","coordinates":[-122.4194,37.7749]}

-- Convert GeoJSON to SDO_GEOMETRY
SELECT SDO_UTIL.FROM_GEOJSON(
    '{"type":"Point","coordinates":[-122.4194,37.7749]}'
) AS location
FROM DUAL;

-- Full feature collection for REST API
SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
        'type' VALUE 'Feature',
        'id'   VALUE store_id,
        'geometry' VALUE JSON(SDO_UTIL.TO_GEOJSON(location)),
        'properties' VALUE JSON_OBJECT(
            'name' VALUE store_name,
            'city' VALUE city
        )
    )
) AS geojson_collection
FROM   store_locations;
```

---

## Best Practices

- **Always register `USER_SDO_GEOM_METADATA`** before creating a spatial index. The metadata defines the valid coordinate extent and tolerance.
- **Use WGS84 (SRID=4326)** for general-purpose geographic data (GPS coordinates). Use projected coordinate systems (UTM, State Plane) when precise metric distances are required.
- **Set tolerance appropriately**: ~0.00001 degrees (≈1 meter) for geographic data, 0.001 for projected data in meters. Too tight a tolerance causes false "not equal" results; too loose conflates nearby features.
- **Use spatial operators (`SDO_RELATE`, `SDO_NN`)** in WHERE clauses — not spatial functions (`SDO_GEOM.*`) — to leverage the spatial index.
- **Pre-compute common distances** for frequently compared geometry pairs and store them as regular NUMBER columns with B-tree indexes.
- **Use `SDO_NN` for nearest-neighbor queries** rather than `SDO_WITHIN_DISTANCE` with large radii, which scans more of the index.
- **Partition large spatial tables** by geographic region (e.g., by state or country) to enable partition pruning in spatial queries.
- **Validate geometry before insertion** using `SDO_GEOM.VALIDATE_GEOMETRY_WITH_CONTEXT`.

```sql
-- Validate geometry before insert
DECLARE
    v_result VARCHAR2(100);
BEGIN
    v_result := SDO_GEOM.VALIDATE_GEOMETRY_WITH_CONTEXT(
        SDO_GEOMETRY(2003, 4326, NULL,
            SDO_ELEM_INFO_ARRAY(1, 1003, 1),
            SDO_ORDINATE_ARRAY(0,0, 1,0, 1,1, 0,1, 0,0)
        ),
        0.001
    );
    IF v_result != 'TRUE' THEN
        RAISE_APPLICATION_ERROR(-20010, 'Invalid geometry: ' || v_result);
    END IF;
END;
```

---

## Common Mistakes

### Mistake 1: Creating Spatial Index Without Metadata

```sql
-- WRONG: will fail with ORA-13203
CREATE INDEX idx_spatial ON stores(location) INDEXTYPE IS MDSYS.SPATIAL_INDEX;

-- RIGHT: insert metadata first, then create index
INSERT INTO user_sdo_geom_metadata VALUES (...);
COMMIT;
CREATE INDEX idx_spatial ON stores(location) INDEXTYPE IS MDSYS.SPATIAL_INDEX;
```

### Mistake 2: Swapping Latitude and Longitude

Oracle's SDO_GEOMETRY for WGS84 (SRID=4326) uses **(longitude, latitude)** order — not (lat, lon). This is consistent with the mathematical (x, y) convention and the OGC/GeoJSON standard, but opposite to how many people verbally describe coordinates.

```sql
-- WRONG: latitude first
SDO_POINT_TYPE(37.7749, -122.4194, NULL)  -- this plots in the Atlantic Ocean

-- RIGHT: longitude first, then latitude
SDO_POINT_TYPE(-122.4194, 37.7749, NULL)  -- San Francisco
```

### Mistake 3: Using SDO_GEOM Functions in WHERE Clause (No Index)

```sql
-- WRONG: SDO_GEOM.SDO_DISTANCE does not use the spatial index
WHERE SDO_GEOM.SDO_DISTANCE(s.location, :point, 0.001) < 5000;

-- RIGHT: use SDO_WITHIN_DISTANCE to get index-accelerated search
WHERE SDO_WITHIN_DISTANCE(s.location, :point, 'distance=5000') = 'TRUE'
```

### Mistake 4: Not Closing Polygon Rings

A polygon's first and last coordinate pairs must be identical to close the ring. An unclosed ring produces invalid geometry.

### Mistake 5: Wrong Tolerance for Coordinate System

Using a very small tolerance (e.g., 0.000001) with projected coordinates in meters (where units are large numbers) causes nearly every operation to return unexpected results. Match tolerance to the unit scale of the SRID.

---


## Oracle Version Notes (19c vs 26ai)

- Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
- Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
- For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

- [Oracle Database 19c Spatial and Graph Developer's Guide (SPATL)](https://docs.oracle.com/en/database/oracle/oracle-database/19/spatl/)
- [Oracle Database 19c SQL Multimedia and Image Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/imref/)
