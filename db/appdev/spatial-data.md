# Spatial data managed in the Oracle Database

## Overview

The Oracle Database has comprehensive data types, models, services, and tools for advanced spatial data management, analytics, and visualization. The spatial features (also known as Oracle Spatial) benefit from Oracle Database enterprise scalability, security, and performance. They are available for every Oracle Database edition starting with version 12c regardless of where the database is installed and running. Oracle Spatial is fully integrated with SQL and PL/SQL, enabling spatial queries to participate in joins, aggregations, and query optimizations.

All Database objects related to Oracle Spatial are located  inside the `MDSYS` schema.  
Additional features and tools meant to work with spatial data are available, such as

* inside `$ORACLE_HOME/md/demo/examples`after installing the *Oracle AI Database Examples*
* as *Oracle Spatial Studio*, a self-service, no-code web application that allows you to visualize, explore, and analyze geospatial data. It can be downloaded from [here](https://www.oracle.com/database/technologies/spatial-studio/oracle-spatial-studio-downloads.html) and used without any licensing costs.

This document focuses on the support for **vector data** in Oracle Spatial introduced with Oracle Database version 8i via the object-relational data type `SDO_GEOMETRY`.   
Vector data are also known as geometries or features, representing spatial objects that can be points, lines, polygons, curves, and combinations of these.

The Oracle Spatial support for vector data is conformant with the **Open Geospatial Consortium (OGC) Simple Features Specification 1.1.1**.

## SDO_GEOMETRY object type used for vector data

`SDO_GEOMETRY` is the data type to store vector data in the Oracle Database. A description of the object type definition and its associated methods can be retrieved using

### SDO_GEOMETRY object type definition

```sql
DESCRIBE MDSYS.SDO_GEOMETRY;
```

```txt
Name          Null? Type                        Description
------------- ----- --------------------------- -------------------------------------
SDO_GTYPE           NUMBER                      Defines the geometry type
SDO_SRID            NUMBER                      Identifier for the coordinate system (spatial reference system) to be associated with the geometry
SDO_POINT           MDSYS.SDO_POINT_TYPE()      Optimized storage for point geometries (2D/3D)
SDO_ELEM_INFO       MDSYS.SDO_ELEM_INFO_ARRAY() Array of numbers that contain information about how to interpret the ordinates stored in the SDO_ORDINATES attribute
SDO_ORDINATES       MDSYS.SDO_ORDINATE_ARRAY()  Array of numbers that stores the coordinate values of all ordinates in a geometry
```

#### SDO_GTYPE

`SDO_GTYPE` is a numeric encoding for the type of the geometry (point, line, polygon, ...).

##### List of most common geometry types

| SDO_GTYPE | Dimension | Constant | Description |
|---|---|---|---|
| 2001 | 2D | SDO_POINT2D | A single point |
| 3001 | 3D | SDO_POINT3D | A single point |
| 2002 | 2D | SDO_LINESTRING2D | A line string |
| 3002 | 3D | SDO_LINESTRING3D | A line string |
| 2002 | 2D | SDO_CURVE2D | A curve |
| 3002 | 3D | SDO_CURVE3D | A curve |
| 2003 | 2D | SDO_POLYGON2D | A polygon |
| 3003 | 3D | SDO_POLYGON3D | A polygon |
| 2004 | 2D | SDO_COLLECTION2D | A polygon |
| 3004 | 3D | SDO_COLLECTION3D | A polygon |
| 2005 | 2D | SDO_POINT2D | A multi-point |
| 3005 | 3D | SDO_POINT3D | A multi-point |
| 2006 | 2D | SDO_LINESTRING2D | A multi-line string |
| 3002 | 3D | SDO_LINESTRING3D | A multi-line string |
| 2006 | 2D | SDO_CURVE2D | A multi-curve |
| 3006 | 3D | SDO_CURVE3D | A multi-curve |
| 2007 | 2D | SDO_POLYGON2D | A multi-polygon |
| 3007 | 3D | SDO_POLYGON3D | A multi-polygon |

Further geometry types include solids and multi-solids.

Note: The constants were introduced with Oracle Database version 23ai.

#### SDO_SRID

**Coordinate systems**, or **Coordinate Reference Systems**, identified by their Spatial Reference ID (SRID), are used to precisely define locations on the Earth´s surface.  

A database containing most of the world-wide coordinate systems is available via http://epsg.io.
SRIDs are equivalent with the codes used in the EPSG database.

There are two main types of coordinate systems:

| Type of coordinate systems | Description | Measured in | Example |
|---|---|---|---|
| Geographic Coordinate System | A global coordinate system that locates points on a 3D, spherical model of the Earth. | Decimal degrees (latitude, longitude) | World-Geodetic System 1984 (WGS 84) |
| Projected Coordinate System | A global coordinate system used to map the Earth on a flat plane by dividing it into 60 longitudinal zones. | Linear units (such as meters or feet) | Universal Transverse Mercator (UTM) |

The `SDO_GEOMETRY` type is used for geometries of both types of coordinate systems.

Note, that the term Geographic Coordinate System is often interchangeably used with Geodetic Coordinate System, such as:

* *The data is in a geographic coordinate system (lat/lon).*
* *The data is in geodetic coordinates.*

This typically means that the coordinates are stored as latitude and longitude on a reference ellipsoid rather than as projected coordinates such as UTM or Web Mercator.

A Geodetic Coordinate System is closely related to the term Geographic Coordinate System, but focuses more on the mathematical/geodetic definition of the coordinates.

##### Coordinate systems information

Information about all registered coordinate systems can be retrieved using public views owned by user `MDSYS`. The most basic view is `CS_SRS`. Among other information, it returns a human-readable summary as Well-Known Text (WKT).

```sql
SELECT * FROM cs_srs ORDER BY srid;
```

The WKT description for SRID=4326 is as follows:

```txt
GEOGCS [ "WGS 84", DATUM ["World Geodetic System 1984 (EPSG ID 6326)", SPHEROID ["WGS 84 (EPSG ID 7030)", 6378137.0, 298.257223563]], PRIMEM [ "Greenwich", 0.000000000 ], UNIT ["Decimal Degree", 0.0174532925199433]]
```

More detailed information can be found using additional views, such as `SDO_COORD_REF_SYSTEM`, `SDO_DATUMS`, or `SDO_ELLIPSOIDS`.

```sql
-- The following query returns information about the ellipsoid, datum shift, rotation, and scale adjustment for SRID=4123
SELECT
  ell.semi_major_axis,
  ell.inv_flattening,
  ell.semi_minor_axis,
  ell.uom_id,
  dat.shift_x,
  dat.shift_y,
  dat.shift_z,
  dat.rotate_x,
  dat.rotate_y,
  dat.rotate_z,
  dat.scale_adjust
FROM
  sdo_coord_ref_system crs,
  sdo_datums dat,
  sdo_ellipsoids ell
WHERE
  crs.srid = 4123 and
  dat.datum_id = crs.datum_id and
  ell.ellipsoid_id = dat.ellipsoid_id;
```

```txt
SEMI_MAJOR_AXIS INV_FLATTENING SEMI_MINOR_AXIS     UOM_ID    SHIFT_X    SHIFT_Y    SHIFT_Z   ROTATE_X   ROTATE_Y   ROTATE_Z SCALE_ADJUST
--------------- -------------- --------------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ------------
        6378388            297      6356911.95       9001      -90.7     -106.1     -119.2       4.09       .218      -1.05         1.37
```

##### List of most common coordinate systems

| SDO_SRID | Constant | Name | Description |
|---|---|---|---|
| 4326 | SDO_LONLAT | World Geodetic System 84 (WGS 84) | The most common coordinate system identifier for WGS 84. It represents locations on Earth with values for latitude and longitude. |
| 3857 | SDO_WEBMERCATOR | Web Mercator or Pseudo-Mercator | The standard projected coordinate system used by almost all major web mapping applications. |
| 4269 | | North American Datum of 1983 (NAD83) | The official standard reference frame and geometric datum used for mapping, surveying, and navigation in North America. |
| 4258 | | European Terrestrial Reference System 1989 (ETRS 89) | The official geodetic reference frame for Europe. |
| 4277 | | Ordnance Survey of Great Britain 1936 (OSGB36) | The standard geodetic datum and coordinate system used for all mapping and topographic surveys in Great Britain |

Notes:

* The constants were introduced with Oracle Database version 23ai.
* The coordinate system with SRID=8307 is an Oracle-defined coordinate system and equivalent with SRID=4326. It was defined when the Spatial support was added to the Oracle Database. It is recommended to use 4326 instead of 8307.

#### SDO_POINT

The `SDO_POINT` attribute is defined using the `SDO_POINT_TYPE` object type, which has the attributes X, Y, and Z, all of type `NUMBER`.

### SDO_POINT_TYPE object type definition

```sql
DESCRIBE MDSYS.SDO_POINT_TYPE;
```

```txt
Name Null? Type
---- ----- ------
X          NUMBER
Y          NUMBER
Z          NUMBER
```

#### SDO_ELEM_INFO

The `SDO_ELEM_INFO` attribute, defined using the `SDO_ELEM_INFO_ARRAY` object type, is a number array of varying length. It gives instructions how to interpret the ordinates stored in the `SDO_ORDINATES` attribute.  
Each triplet set of numbers in the array is asscoiated with the following attributes:

* `SDO_STARTING_OFFSET`: Indicates the offset within the SDO_ORDINATES array where the first ordinate for this element is stored. Offset values start at 1 and not at 0.
* `SDO_ETYPE`: Indicates the type of the element.
* `SDO_INTERPRETATION`: Means one of two things, depending on whether or not SDO_ETYPE is a compound element.

  * If it is a compound element, it specifies how many subsequent triplet values are part of the element.
  * Otherwise, it determines how the sequence of ordinates for this element is interpreted.

The combinations of `SDO_ETYPE` and `SDO_INTERPRETATION` need to be valid. It means that the values and semantics in `SDO_ELEM_INFO` follows what is defined and documented in the Spatial Developer´s Guide.

##### SDO_ELEM_INFO examples

| SDO_ETYPE | SDO_INTERPRETATION | Meaning
|---|---|---|
| 1 | 1 | Point type |
| 1 | 0 | Orientation for an oriented point. |
| 2 | 1 | Line string whose vertices are connected by straight line segments. |
| 2 | 2 | Line string made up of a connected sequence of circular arcs. |
| 1003 or 2003 | 1 | Simple polygon whose vertices are connected by straight line segments. |
| 1003 or 2003 | 3 | Rectangle type ( aka "optimized rectangle"). A bounding rectangle represented by 2 vertices, the lower-left and the upper-right. |

#### SDO_ORDINATES

The `SDO_ORDINATES` attribute is defined using a varying length number array (1048576). It stores the coordinate values that make up the boundary of a geometry, where the boundary is made up by vertices. This array must always be used in conjunction with the `SDO_ELEM_INFO` varying length array. The values in the array are interpreted based on the dimensionality. For 2D data, each pair of numbers is associated with the two coordinate values of a geometry vertex. For a 3D geometry, each triplet of numbers is associated with the three coordinate values of a geometry vertex.

### Important notes

For geometry consistency, the following constraints apply for the specific geometry types:

* With the exception of optimized rectangles, all polygons have at least four vertices which is equivalent with a triangle. The last vertex is the same as the first.
* Optimized rectangles are specified using just 2 vertices, representing the minimum and maximum ordinate values for the X/Y (2D) or X/Y/Z (3D) dimensions.
* Polygons cannot be self-crossing.
* No two consecutive vertices on a line or polygon are the same.
* Polygons are oriented correctly. If polygons have more than one ring, then the exterior ring boundaries must be oriented counterclockwise, and the interior ring boundaries must be oriented clockwise.
* The interior of a polygon is connected.
* Line strings have at least two vertices.
* `SDO_ETYPE` 1-digit and 4-digit values are not mixed (that is, both used) in defining polygon ring elements.
* Vertices on an arc are not colinear (that is, are not on a straight line) and are not the same vertex.

### Insert vector data into a database table

Before inserting any geometries into the Oracle Database, create a table with a column of type `SDO_GEOMETRY`.  
Note, that a table can have one or more columns of type `SDO_GEOMETRY`. This makes sense, for example, if geometries need to be persisted in more than one coordinate system.

```sql
-- Create a geometry table meant to store a mix of geometries
CREATE TABLE geometries (
  id          NUMBER NOT NULL,
  geom        SDO_GEOMETRY,
  description VARCHAR2(100),
  CONSTRAINT geometries_pk PRIMARY KEY (id)
);
```

The `geom` column can contain geometries of arbitrary geometry types. However, it is a good practice, to load and store  geometries into separate tables if the geometries represent different geometry types and coordinate systems.

```sql
-- Create a geometry table meant to store 2D points with SRID = 4326.
CREATE TABLE points2d (
  id            NUMBER NOT NULL,
  geom_4326     SDO_GEOMETRY,
  description   VARCHAR2(100),
  CONSTRAINT points2d_pk PRIMARY KEY (id)
);
```

There are several ways to insert or load geometries into a table. Using SQL INSERT statements, here are some examples, assuming the specified tables were created in advance:

```sql
--
-- 2D Points / SRID=4326
--

-- Simplest signature: SDO_GEOMETRY (lon, lat)
-- Oracle Database versions: 23ai and higher
INSERT INTO points2D (
  geom_4326,
  description
)
VALUES (
  SDO_GEOMETRY (13.4050, 52.5200),
  'Berlin City Center, Germany'
);

-- Full signature as described in chapter "SDO_GEOMETRY object type definition"
-- All supported Oracle Database versions
INSERT INTO points2D (
  geom_4326,
  description
)
VALUES (
  SDO_GEOMETRY (
    2001,
    4326,
    SDO_POINT_TYPE (-3.0094, 16.7758, NULL),  -- Requires the NULL as value for the 3rd dimension
    NULL,
    NULL
  ),
  'Timbuktu, Mali'
);

-- Signature with constants for SDO_GTYPE and SDO_SRID
-- Oracle Database versions: 23ai and higher
INSERT INTO points2D (geom_4326, description)
VALUES (
  SDO_GEOMETRY (
    SDO_POINT2D,
    SDO_LONLAT,
    SDO_POINT_TYPE (151,2099, -33.8651),     -- No value for the 3rd dimension
    NULL,
    NULL
  )
  , 'Sydney City Center, Australia'
);
```

```sql
--
-- 3D Points / SRID=4979
--

-- Full signature as described in chapter "SDO_GEOMETRY object type definition"
-- All supported Oracle Database versions
INSERT INTO points3D (
  geom,
  description
)
VALUES (
  SDO_GEOMETRY (
    3001,                                   -- 3D point geometry
    4979,                                   -- 3D equivalent of 4326
    SDO_POINT_TYPE (-74.064, 4.624, 2640),  -- 3rd dimension is the altitude
    NULL,
    NULL,
  ),
  'Bogotá, Colombia'
);

-- Signature with constants for SDO_GTYPE
-- Oracle Database versions: 23ai and higher
INSERT INTO points3D (
  geom,
  description
)
VALUES (
  SDO_GEOMETRY (
    SDO_POINT3D,
    4979,
    SDO_POINT_TYPE (-140.4053, 60.5671, 5959),  -- 3rd dimension is the altitude
    NULL,
    NULL
  ),
  'Mount Logan, Canada'
);
```

```sql
--
-- Line Strings
--
INSERT INTO lines2d (
  geom
)
VALUES (
  SDO_GEOMETRY (
    2002,                          -- 2D - Can also be defined using the constant SDO_LINESTRING2D
    4326,                          -- WGS 84 - Can also be defined using the constant SDO_LONLAT
    NULL,                          -- Always NULL if the geometry type is other than a point
    SDO_ELEM_INFO_ARRAY(1, 2, 1),  -- one line string, straight segments
    SDO_ORDINATE_ARRAY(
      -122.4194, 37.7749,          -- 2D point 1 (start)
      -122.4094, 37.7849,          -- 2D point 2
      -122.3994, 37.7749           -- 2D point 3 (end)
    )
  )
);
```

```sql
--
-- Polygons
--

-- Simple 2D Polygon
INSERT INTO polygons2d (
  geom
)
VALUES (
  SDO_GEOMETRY (
    2003,                             -- 2D - Can also be defined using the constant SDO_POLYGON2D
    4326,                             -- WGS 84 - Can also be defined using the constant SDO_LONLAT
    NULL,                             -- Always NULL if the geometry type is other than a point
    SDO_ELEM_INFO_ARRAY(1, 1003, 1),  -- Exterior ring, straight segments
    SDO_ORDINATE_ARRAY(
      -122.45, 37.75,                 -- SW corner
      -122.40, 37.75,                 -- SE corner
      -122.40, 37.80,                 -- NE corner
      -122.45, 37.80,                 -- NW corner
      -122.45, 37.75                  -- Close the ring. Has to be the same as the first point in the array.
    )
  )
);

-- Polygon with a hole (donut shape)
INSERT INTO polygons2d (
  geom
)
VALUES (
  SDO_GEOMETRY(
    2003,
    4326,
    NULL,
    SDO_ELEM_INFO_ARRAY(
      1, 1003, 1,       -- Outer ring starts at ordinate position 1
      11, 2003, 1       -- Inner ring (hole) starts at ordinate position 11
    ),
    SDO_ORDINATE_ARRAY(
      0, 0,             -- Outer ring starts here: position 1 (5 points = 10 ordinates)
      10, 0,
      10, 10,
      0, 10,
      0, 0,
      2, 2,             -- Inner ring starts here: position 11 / hole (5 points = 10 ordinates)
      8, 2,
      8, 8,
      2, 8,
      2, 2
    )
  )
);
```

## Geometry metadata

**Every SDO_GEOMETRY column in a table must be registered as metadata**. Only then a spatial index can be created which helps to efficiently query spatial data. The geometry (aka spatial) metadata describe the dimensions, lower and upper bounds, and tolerance in each dimension. It is stored in a global table owned by `MDSYS`. This global table is accessible via the `USER_SDO_GEOM_METADATA` updatable view.

Remember, all geometries in a `SDO_GEOMETRY` column must have the same `SDO_SRID` value. Otherwise the spatial index creation will fail.

Note, that effective with Oracle AI Database 26ai, the geometry metadata is automatically created in `USER_SDO_GEOM_METADATA` once a spatial index is created on a geometry column.

### USER_SDO_GEOM_METADATA definition

```sql
DESCRIBE USER_SDO_GEOM_METADATA;
```

```txt
Name        Null?    Type
----------- -------- --------------
TABLE_NAME  NOT NULL VARCHAR2(130)
COLUMN_NAME NOT NULL VARCHAR2(1024)
DIMINFO              SDO_DIM_ARRAY
SRID                 NUMBER
```

#### DIMINFO

The `DIMINFO` column is a varying length array of an object type, ordered by dimension, and has one entry for each dimension.  
The `SDO_DIM_ELEMENT` object type is defined as:

```txt
Name          Null? Type
------------- ----- ------------
SDO_DIMNAME         VARCHAR2(64)
SDO_LB              NUMBER
SDO_UB              NUMBER
SDO_TOLERANCE       NUMBER
```

The number of dimensions reflected in the `DIMINFO` information must match the number of dimensions of each geometry object in the layer. Hence, `DIMINFO` contains two `SDO_DIM_ELEMENT` instances for 2D geometries, and three instances for 3D geometries.

`SDO_TOLERANCE` is used to associate a level of precision with vector data. The tolerance reflects the distance that two points can be apart and still be considered the same. The tolerance value must be a positive number greater than zero. The smaller the tolerance value, the more precision is to be associated with the data.

For geometries in a **Geographic Coordinate Systems** such as WGS 84, the tolerance value is in unit-spheres, where 1 unit-sphere is a sphere with a radius of 1.0. Hence, choose the right tolerance value that is matching the precision of your vector data using the following table. I The recommended tolerance value is 0.005 (5 millimeters). The smallest supported tolerance value is 0.001 (1 millimeter).

For **Projected Coordinate System** the tolerance value is expressed in meters.

### USER_SDO_GEOM_METADATA examples

```sql
-- Example POINTS2D table
INSERT INTO USER_SDO_GEOM_METADATA (
  table_name,
  column_name,
  diminfo,
  srid
)
VALUES (
  'points2d',
  'geom_4326',
  SDO_DIM_ARRAY(
    SDO_DIM_ELEMENT('Longitude', -180, 180, 1), -- 1 meter tolerance
    SDO_DIM_ELEMENT('Latitude', -90, 90, 1)     -- 1 meter tolerance
  ),
  4326                                          -- WGS 84
)

-- Example POINTS3D table
INSERT INTO USER_SDO_GEOM_METADATA (
  table_name,
  column_name,
  diminfo,
  srid
)
VALUES (
  'points3d',
  'geom',
  SDO_DIM_ARRAY(
    SDO_DIM_ELEMENT('Longitude', -180, 180, 1)
    SDO_DIM_ELEMENT('Latitude', -90, 90, 1)
    SDO_DIM_ELEMENT('Height', -10, 9000, 1)
  ),
  4979                                          -- WGS 84 (3D)
);

COMMIT;
```

The validity of entries in the USER_SDO_GEOM_METADATA can be verified using the following queries:

```sql
-- Verify that the metadata was inserted correctly
SELECT
  *
FROM
  USER_SDO_GEOM_METADATA
ORDER BY
  table_name,
  column_name;

-- Check if there are spatial tables without metadata
SELECT
  table_name,
  column_name
FROM
  USER_TAB_COLUMNS
WHERE
  data_type = 'SDO_GEOMETRY'
  AND (table_name, column_name) NOT IN (
    SELECT
      table_name,
      column_name
    FROM
      USER_SDO_GEOM_METADATA
  )
ORDER BY
  table_name,
  column_name;

-- Check for spatial tables with invalid bounds (lower bound > upper bound)
SELECT
  table_name,
  column_name,
  sdo_dimname,
  sdo_lb,
  sdo_ub
FROM
  USER_SDO_GEOM_METADAta,
  TABLE (diminfo)
WHERE
  sdo_lb > sdo_ub
ORDER BY
  table_name;

```

## Spatial indexes

A spatial index typically enables efficient performance when querying vector data. A spatial index can be created as:

* R-tree index (Rectangle tree)
* CBTREE index (optimized index for large point datasets)
* Cross-schema spatial index
* Partitioned spatial index

It is a best practice to create a spatial index for each geometry column in a table.

Effective with the Oracle Database release 12.2 spatial indexes can be system-managed by specifying `INDEXTYPE=MDSYS.SPATIAL_INDEX_V2` at index creation. You are strongly encouraged to use this index type for all new spatial indexes created, regardless of whether the spatial table or the spatial index is partitioned.  
The main benefit is a simplified spatial index management. This is most beneficial in cases of partitioning, because this new index type eliminates the need for most, if not all, index
partitioning management operations. Full support is provided for almost all Oracle Database base table partitioning models, including:

* Single-level partitioning: range, hash, list
* Composite partitioning: range-range, range-hash, range-list, list-range, list-hash, list-list,
hash-hash, hash-list, hash-range
* Partitioning extensions: interval (but not interval-based composite partitions), reference,
virtual column-based partitioning

### Spatial index syntax

```txt
-- Create a spatial index
CREATE INDEX [schema.]index ON [schema.]table (column)
INDEXTYPE IS MDSYS.SPATIAL_INDEX_V2
[PARAMETERS ('index_params [physical_storage_params]' )]
[{ NOPARALLEL | PARALLEL [ <degree of parallelism> ] }];

-- Drop a spatial index
DROP INDEX [schema.]index [FORCE];

-- Alter a spatial index
ALTER INDEX [schema.]index PARAMETERS ('index_params [physical_storage_params]' )
[{ NOPARALLEL | PARALLEL [ <degree of parallelism> ] }] ;

-- Rebuild a spatial index (option 1)
ALTER INDEX [schema.]index REBUILD
[PARAMETERS ('rebuild_params [physical_storage_params]' ) ]
[{ NOPARALLEL | PARALLEL [ <degree of parallelism> ] }] ;

-- Rebuild a spatial index (option 2)
ALTER INDEX [schema.]index REBUILD ONLINE
[PARAMETERS ('rebuild_params [physical_storage_params]' ) ]
[{ NOPARALLEL | PARALLEL [ <degree of parallelism> ] }] ;

-- Rebuild a spatial index (option 3)
ALTER INDEX [schema.]index REBUILD PARTITION partition
[PARAMETERS ('rebuild_params [physical_storage_params]' ) ];
```

Notes:

* `index_params` is a list of parameters as key-value pairs used to optimize the index creation.
* `<degree of parallelism>` is an integer value specifying the degree of parallelism (DOP) when `PARALLEL` is enabled.

The following metadata views contain basic information about spatial indexes:

* `USER_SDO_INDEX_INFO` contains index information for all spatial tables owned by the user.
* `ALL_SDO_INDEX_INFO` contains index information for all spatial tables on which the user has SELECT permission.

The following views contain detailed information about spatial index metadata:

* `USER_SDO_INDEX_METADATA` contains index information for all spatial tables owned by the user.
* `ALL_SDO_INDEX_METADATA` contains index information for all spatial tables on which the user has SELECT permission.

### Spatial index examples

```sql
-- Create an R-Tree index for 2D polygons
CREATE INDEX polygons2d_geom_sidx ON polygons2d (geom)
INDEXTYPE IS MDSYS.SPATIAL_INDEX_V2;

-- Create an R-Tree index for 2D polygons and specify PARALLEL
CREATE INDEX polygons2d_geom_sidx ON polygons2d (geom)
INDEXTYPE IS MDSYS.SPATIAL_INDEX_V2 PARALLEL;

-- Create an R-Tree index for 2D polygons and specify PARALLEL with DOP=4
CREATE INDEX polygons2d_geom_sidx ON polygons2d (geom)
INDEXTYPE IS MDSYS.SPATIAL_INDEX_V2 PARALLEL (4);

-- Create a CBTREE index for 2D data => Specify index parameters. Constrain data POINT as the geometry type and CBTREE as index type.
CREATE INDEX points2d_geom_4326_cb_sidx ON points2d (geom_4326)
INDEXTYPE IS MDSYS.SPATIAL_INDEX_V2 ('layer_gtype=POINT cbtree_index=true');

-- Create a partitioned R-Tree index on 2D data => Use the LOCAL keyword
CREATE INDEX polygons2d_geom_part_sidx ON polygons2d (geom)
INDEXTYPE IS MDSYS.SPATIAL_INDEX_V2 LOCAL;

-- Create an R-Tree index on 3D data
CREATE INDEX polygons3d_geom_sidx ON polygons3d (geom)
INDEXTYPE IS MDSYS.SPATIAL_INDEX_V2 PARAMETERS ('sdo_indx_dims=3');
-- Note: `sdo_indx_dims=2` is the default and does not need to be specified explicitly.
```

Information about the created indexes can be retrieved using the following queries:

```sql
-- Query metadata specific to spatial indexes - Basic information
SELECT
  *
FROM
  USER_SDO_INDEX_INFO
ORDER BY
  table_name,
  column_name;

-- Query metadata specific to spatial indexes - Detailed information
SELECT
  *
FROM
  USER_SDO_INDEX_METADATA
ORDER BY
  sdo_index_type,
  sdo_index_name;

-- Verify the index creation. The value of attribute STATUS needs to be VALID.
SELECT
  index_name,
  status,
  ityp_owner,
  ityp_name
FROM
  USER_INDEXES
WHERE
  ityp_name = 'SPATIAL_INDEX_V2'
ORDER BY
  index_name;

-- Estimate the size of spatial indexes
SELECT
  table_name,
  column_name,
  SDO_TUNE.ESTIMATE_RTREE_INDEX_SIZE (user, table_name, column_name) mb
FROM
  USER_TAB_COLUMNS
WHERE
  data_type = 'SDO_GEOMETRY'
ORDER BY
  table_name;

-- Estimate the space that will be needed to create a spatial index for:
--   Number of objects      1000000
--   Block size             8192
--   Percent free           10
--   Dimensions             2
--   Geodetic ?             1 (YES)
SELECT
  SDO_TUNE.ESTIMATE_RTREE_INDEX_SIZE (1000000, 8192, 10, 2, 1) mb
FROM
  DUAL;

-- Check the index size
SELECT
  i.table_name,
  i.index_name,
  si.column_name,
  si.sdo_index_table,
  s.tablespace_name,
  CASE
    WHEN s.bytes > 1024*1024*1024   THEN s.bytes/1024/1024/1024 || ' GB'
    WHEN s.bytes > 1024*1024        THEN s.bytes/1024/1024 || ' MB'
    WHEN s.bytes > 1024             THEN s.bytes/1024 || ' KB'
  END allocation
FROM
  USER_INDEXES i,
  USER_SDO_INDEX_INFO si,
  USER_SEGMENTS s
WHERE
  i.index_type = 'DOMAIN'
  AND i.ityp_name = 'SPATIAL_INDEX_V2'
  AND i.index_name = si.index_name
  AND s.segment_name = si.sdo_index_table
ORDER BY
  i.table_name,
  i.index_name;

-- Check for spatial tables without a spatial index
SELECT
  table_name,
  column_name
FROM
  USER_TAB_COLUMNS
WHERE
  data_type = 'SDO_GEOMETRY'
  AND (table_name, column_name) NOT IN (
    SELECT
      table_name,
      column_name
    FROM
      user_sdo_index_info
)
ORDER BY
  table_name,
  column_name;

-- Check for invalid spatial indexes
SELECT
  table_name,
  index_name
FROM
  user_indexes
WHERE
  index_type = 'DOMAIN'
  AND ityp_name = 'SPATIAL_INDEX'
  AND domidx_opstatus = 'FAILED'
ORDER BY
  table_name;

-- Check spatial indexes with LOADING/FAILED/UNUSABLE error (failed index creation)
SELECT
  index_name,
  table_name,
  status,
  domidx_opstatus
FROM
  user_indexes
WHERE
  domidx_opstatus IS NOT NULL
  AND domidx_opstatus != 'VALID';

-- Check index LOBs
SELECT
  i.table_name,
  l.securefile
FROM
  USER_SDO_INDEX_INFO I,
  USER_LOBS L
WHERE
  i.sdo_index_table = l.table_name
ORDER BY
  table_name;
```

After performing bulk loads, it is recommended to rebuild the spatial index.

```sql
-- Rebuild a spatial index, e.g., after bulk loads
ALTER INDEX polygons3d_geom_sidx REBUILD;
```
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

-- multi-ple masks combined with +
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

## Putting it all together

Here is the sample workflow to walk through:

1. Create two spatial tables, one for point geometries and one for polygons.
2. Populate the tables with sample data.
3. Register the spatial metadata.
4. Validate the geometries.
5. Create the spatial indexes.
6. Execute spatial queries.

The following scripts work with basic table defintions and randomly generated sample data.

```sql
--
-- Step 1
--

-- Create the points table
CREATE TABLE locations (
  id          NUMBER PRIMARY KEY,
  location    SDO_GEOMETRY
);

-- Create the polygons table
CREATE TABLE areas (
  id          NUMBER PRIMARY KEY,
  geom        SDO_GEOMETRY
);

```

```sql
--
-- Step 2
--

-- Populate the points table with sample data
DECLARE
  TYPE t_locations IS TABLE of locations%ROWTYPE;
  l_tab t_locations := t_locations();

  -- Sample size
  l_size     NUMBER    := 100000;
  l_lastid   NUMBER;
  l_curr_lon NUMBER;
  l_curr_lat NUMBER;
  l_geom     SDO_GEOMETRY;
BEGIN

  -- Fetch the last id
  SELECT
    nvl(max(id),1) + 1
  INTO
    l_lastid
  FROM
    locations;

  -- Populate sample as collection
  FOR i IN 1 .. l_size LOOP

    l_curr_lon := ROUND(DBMS_RANDOM.VALUE(6,27),10);
    l_curr_lat := ROUND(DBMS_RANDOM.VALUE(45,54),10);
    l_geom := MDSYS.SDO_GEOMETRY(2001, 4326, SDO_POINT_TYPE (L_CURR_LON, L_CURR_LAT, NULL), NULL, NULL);

    l_tab.extend;
    l_tab(l_tab.last).id := l_lastid;
    l_tab(l_tab.last).location := l_geom;

    l_lastid := l_lastid + 1;

  END LOOP;

  -- Ingest table with point geometries
  FORALL i IN l_tab.first .. l_tab.last
    INSERT /*+ APPEND_VALUES */ INTO locations VALUES l_tab(i);

  COMMIT;
END;
/

-- Populate the polygons table with sample data
DECLARE
  TYPE t_areas IS TABLE OF areas%ROWTYPE;
  l_tab t_areas := t_areas();

  l_size NUMBER := 20000;
  l_lastid NUMBER;

  -- X = longitude, Y = latitude
  l_min_lon CONSTANT NUMBER := 45;
  l_max_lon CONSTANT NUMBER := 54;
  l_min_lat CONSTANT NUMBER := 6;
  l_max_lat CONSTANT NUMBER := 27;

  l_x1 NUMBER;
  l_y1 NUMBER;
  l_x2 NUMBER;
  l_y2 NUMBER;
  l_width NUMBER;
  l_height NUMBER;

BEGIN
  SELECT
    NVL(MAX(id), 0) + 1
  INTO
    l_lastid
  FROM
    areas;

  FOR i IN 1 .. l_size LOOP
    -- Rectangle size in degrees
    l_width  := DBMS_RANDOM.VALUE(0.01, 1.50);
    l_height := DBMS_RANDOM.VALUE(0.01, 1.00);

    -- Lower-left corner, ensuring upper-right stays inside bounds.
    l_x1 := ROUND(DBMS_RANDOM.VALUE(l_min_lon, l_max_lon - l_width), 10);
    l_y1 := ROUND(DBMS_RANDOM.VALUE(l_min_lat, l_max_lat - l_height), 10);

    l_x2 := ROUND(l_x1 + l_width, 10);
    l_y2 := ROUND(l_y1 + l_height, 10);

    l_tab.EXTEND;
    l_tab(l_tab.LAST).id := l_lastid;
    l_tab(l_tab.LAST).geom :=
      MDSYS.SDO_GEOMETRY(
        2003,
        4326,
        NULL,
        MDSYS.SDO_ELEM_INFO_ARRAY(1, 1003, 3),
        MDSYS.SDO_ORDINATE_ARRAY(l_x1, l_y1, l_x2, l_y2)
      );

    l_lastid := l_lastid + 1;
  END LOOP;

  FORALL i IN l_tab.FIRST .. l_tab.LAST
    INSERT /*+ APPEND_VALUES */ INTO areas VALUES l_tab(i);

  COMMIT;
END;
/
```

```sql
--
-- Step 3
--

-- Register spatial metadata for the points table
INSERT INTO user_sdo_geom_metadata (table_name, column_name, diminfo, srid)
VALUES (
  'LOCATIONS',
  'LOCATION',
  SDO_DIM_ARRAY(
    SDO_DIM_ELEMENT('lon', -180, 180, 0.005),
    SDO_DIM_ELEMENT('lat', -90, 90, 0.005)
  ),
  4326  -- WGS84
);

-- Register spatial metadata for the polygons table
INSERT INTO user_sdo_geom_metadata (table_name, column_name, diminfo, srid)
VALUES (
  'AREAS',
  'AREA',
  SDO_DIM_ARRAY(
    SDO_DIM_ELEMENT('lon', -180, 180, 0.005),
    SDO_DIM_ELEMENT('lat', -90, 90, 0.005)
  ),
  4326  -- WGS84
);

COMMIT;
```

```sql
--
-- Step 4
--

-- Validate all geometries. Write the results into a table.
DROP TABLE geometry_errors PURGE;

CREATE TABLE geometry_errors (
  table_name      VARCHAR2(100),
  column_name     VARCHAR2(100),
  obj_rowid       ROWID,
  geometry        SDO_GEOMETRY,
  tolerance       NUMBER,
  error_code      CHAR(5),
  error_message   VARCHAR2(256),
  error_context   VARCHAR2(256)
);

DECLARE
  DEFAULT_TOLERANCE   NUMBER := 0.005;
  COMMIT_FREQUENCY    NUMBER := 100;
  geom_cursor         SYS_REFCURSOR;
  v_diminfo           SDO_DIM_ARRAY;
  v_srid              NUMBER;
  v_tolerance         NUMBER;
  v_rowid             ROWID;
  v_geometry          SDO_GEOMETRY;
  v_num_rows          NUMBER;
  v_num_errors        NUMBER;
  v_error_code        CHAR(5);
  v_error_message     VARCHAR2(256);
  v_error_context     VARCHAR2(256);
  v_status            VARCHAR2(256);

BEGIN
  -- Process all spatial tables
  FOR t IN (
    SELECT
      table_name,
      column_name
    FROM
      USER_TAB_COLUMNS
    WHERE
      data_type = 'SDO_GEOMETRY'
      AND table_name <> 'GEOMETRY_ERRORS'
    ORDER BY
      table_name,
      column_name
  )
  LOOP

    -- Get tolerance from the metadata
    BEGIN
      SELECT
        diminfo,
        srid
      INTO
        v_diminfo,
        v_srid
      FROM
        USER_SDO_GEOM_METADATA
      WHERE
        table_name = t.table_name
        AND column_name = t.column_name;
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        v_diminfo := NULL;
        v_srid := NULL;
    END;

    -- If no metadata, then use the default tolerance
    IF v_diminfo IS NULL THEN
      v_tolerance := DEFAULT_TOLERANCE;
    ELSE
      v_tolerance := v_diminfo(1).sdo_tolerance;
    END IF;

    -- Process the geometries
    v_num_rows := 0;
    v_num_errors := 0;

    OPEN geom_cursor FOR
      'SELECT ROWID, ' || t.column_name || ' FROM ' || t.table_name;

    LOOP
      v_status := NULL;

      -- Fetch the geometry
      FETCH geom_cursor INTO v_rowid, v_geometry;
      EXIT WHEN geom_cursor%NOTFOUND;

      v_num_rows := v_num_rows + 1;

      IF v_geometry IS NOT NULL THEN
        -- Validate the geometry
        v_status := SDO_GEOM.VALIDATE_GEOMETRY_WITH_CONTEXT(v_geometry, v_tolerance);

        -- Log the error (if any)
        IF v_status <> 'TRUE' THEN
          -- Count the errors
          v_num_errors := v_num_errors + 1;

          -- Format the error message
          IF LENGTH(v_status) >= 5 THEN
            v_error_code := SUBSTR(v_status, 1, 5);
            v_error_message := SQLERRM(-v_error_code);
            v_error_context := SUBSTR(v_status, 7);
          ELSE
            v_error_code := v_status;
            v_error_message := NULL;
            v_error_context := NULL;
          END IF;

          -- Write the error
          INSERT INTO geometry_errors (
            table_name,
            column_name,
            obj_rowid,
            geometry,
            tolerance,
            error_code,
            error_message,
            error_context
          )
          VALUES (
            t.table_name,
            t.column_name,
            v_rowid,
            v_geometry,
            v_tolerance,
            v_error_code,
            v_error_message,
            v_error_context
          );
        END IF;

        -- Commit as necessary
        IF MOD(v_num_rows, COMMIT_FREQUENCY) = 0 THEN
          COMMIT;
        END IF;

      END IF;

    END LOOP;

    CLOSE geom_cursor;
  END LOOP;

  -- Final commit
  COMMIT;
END;
/

-- Error summary by table and error code
SELECT
  table_name,
  error_code,
  COUNT(*)
FROM
  geometry_errors
GROUP BY
  table_name,
  error_code
ORDER BY
  table_name,
  error_code;

-- Error summary by error code and table
SELECT
  error_code,
  table_name,
  COUNT(*)
FROM
  geometry_errors
GROUP BY
  error_code,
  table_name
ORDER BY
  error_code,
  table_name;

-- Error details
SELECT
  table_name,
  obj_rowid,
  error_message,
  error_context
FROM
  geometry_errors
ORDER BY
  table_name,
  obj_rowid;
```

```sql
--
-- Step 5
--

```

```sql
--
-- Step 6
--

```

## Working with standard spatial data formats

### GeoJSON integration

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

* **Always register `USER_SDO_GEOM_METADATA`** before creating a spatial index. The metadata defines the valid coordinate extent and tolerance.
* **Use WGS84 (SRID=4326)** for general-purpose geographic data (GPS coordinates). Use projected coordinate systems (UTM, State Plane) when precise metric distances are required.
* **Set tolerance appropriately**: ~0.00001 degrees (≈1 meter) for geographic data, 0.001 for projected data in meters. Too tight a tolerance causes false "not equal" results; too loose conflates nearby features.
* **Use spatial operators (`SDO_RELATE`, `SDO_NN`)** in WHERE clauses — not spatial functions (`SDO_GEOM.*`) — to leverage the spatial index.
* **Pre-compute common distances** for frequently compared geometry pairs and store them as regular NUMBER columns with B-tree indexes.
* **Use `SDO_NN` for nearest-neighbor queries** rather than `SDO_WITHIN_DISTANCE` with large radii, which scans more of the index.
* **Partition large spatial tables** by geographic region (e.g., by state or country) to enable partition pruning in spatial queries.
* **Validate geometry before insertion** using `SDO_GEOM.VALIDATE_GEOMETRY_WITH_CONTEXT`.

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

* Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
* Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
* For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

* [Oracle Database 19c, Spatial Developer's Guide](https://docs.oracle.com/en/database/oracle/oracle-database/19/spatl/)
* [Oracle AI Database 26ai, Spatial Developer's Guide](https://docs.oracle.com/en/database/oracle/oracle-database/26/spatl/)
