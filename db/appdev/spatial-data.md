# Spatial data managed in the Oracle Database

## Overview

The Oracle Database has comprehensive data types, models, services, and tools for advanced spatial data management, analytics, and visualization. The spatial features (also known as Oracle Spatial) benefit from Oracle Database enterprise scalability, security, and performance. Oracle Spatial does not require an extra
cost license. Its features can be used for development and deployment purposes with all on-prem Oracle Database editions and Oracle Cloud Database Services. Oracle Spatial is fully integrated with SQL and PL/SQL, enabling spatial queries to participate in joins, aggregations, and query optimizations.

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

| Constant | SDO_GTYPE | Description |
|---|---|---|
| SDO_POINT2D | 2001 | A geometry that contains a 2D point |
| SDO_POINT3D | 3001 | A geometry that contains a 3D point |
| SDO_CURVE2D | 2002 | A geometry that contains a 2D circular arc segment |
| SDO_CURVE3D | 3002 | A geometry that contains a 3D circular arc segment |
| SDO_LINESTRING2D | 2002 | A geometry that contains a 2D straight line string |
| SDO_LINESTRING3D | 3002 | A geometry that contains a 3D straight line string |
| SDO_POLYGON2D | 2003 | A geometry that contains a 2D polygon |
| SDO_POLYGON3D | 3003 | A geometry that contains a 3D polygon |
| SDO_COLLECTION2D | 2004 | A hetergenous collection of 2D geometries |
| SDO_COLLECTION3D | 3004 | A hetergenous collection of 3D geometries |
| SDO_MULTIPOINT2D | 2005 | A geometry with one or more 2D points |
| SDO_MULTIPOINT3D | 3005 | A geometry with one or more 3D points |
| SDO_MULTICURVE2D | 2006 | A geometry that contains one or more 2D circular arc segments |
| SDO_MULTICURVE3D | 3006 | A geometry that contains one or more 3D circular arc segments |
| SDO_MULTILINESTRING2D | 2006 | A geometry that contains one or more 2D straight line strings |
| SDO_MULTILINESTRING3D | 3006 | A geometry that contains one or more 3D straight line strings |
| SDO_MULTIPOLYGON2D | 2007 | A geometry that can have multiple disjoint 2D polygons or surfaces |
| SDO_MULTIPOLYGON3D | 3007 | A geometry that can have multiple disjoint 3D polygons or surfaces |

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

In the preceding example, the `UOM_ID` represents the unit of measure for `SEMI_MAJOR_AXIS` (a) and `SEMI_MINOR_AXIS` (b). `INV_FLATTENING` is `a/(a-b)` and has no associated unit. Shifts are in meters, rotation angles are given in arc seconds, and scale adjustment in parts per million. To interpret the `UOM_ID`, the units table can be queried, as shown in the following example:

```sql
SELECT unit_of_meas_name FROM SDO_UNITS_OF_MEASURE WHERE uom_id = 9001;
```

```txt
UNIT_OF_MEAS_NAME
-----------------
metre
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

Notes:

* The tolerance value defines the distance two points representing vertices on lines or polygons can be apart and still be considered the same. It must be a positive number.
* All geometries in a `SDO_GEOMETRY` column must have the same `SDO_SRID` value. Otherwise the spatial index creation will fail.
* Effective with Oracle AI Database 23ai, the geometry metadata is automatically created in `USER_SDO_GEOM_METADATA` once a spatial index is created on a geometry column.

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
    SDO_DIM_ELEMENT('Longitude', -180, 180, 1),
    SDO_DIM_ELEMENT('Latitude', -90, 90, 1)
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
    SDO_DIM_ELEMENT('Longitude', -180, 180, 1),
    SDO_DIM_ELEMENT('Latitude', -90, 90, 1),
    SDO_DIM_ELEMENT('Height', -10, 9000, 1)
  ),
  4979                                          -- WGS 84 (3D)
);

COMMIT;
```

The validity of entries in the `USER_SDO_GEOM_METADATA` can be verified using the following queries:

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
* CBTREE index (Composite B-Tree index, optimized for large point datasets)
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

-- Delete a spatial index
DROP INDEX polygons3d_geom_sidx;

-- Create a Local Partitioned Spatial Index specifying the UNUSABLE keyword followed by ALTER INDEX REBUILD statements that are called in parallel
CREATE INDEX geometry_data_geom_sidx ON geometry_data (geom)
INDEXTYPE IS mdsys.spatial_index_v2
PARAMETERS ('tablespace=tbs1 work_tablespace=work_tbs')
LOCAL UNUSABLE;

ALTER INDEX geometry_data_geom_sidx REBUILD PARTITION ip1;
ALTER INDEX geometry_data_geom_sidx REBUILD PARTITION ip2;
...
ALTER INDEX geometry_data_geom_sidx REBUILD PARTITION ip10;

-- Clean up a spatial index after a failure using FORCE. It also forces the deletion to be performed even if the index is marked in-process.
DROP INDEX geometry_data_geom_sidx FORCE;
```

### Spatial index metadata

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
```

### Spatial index validations

Use the following queries to detect any issues related to spatial indexes:

```sql
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

### Spatial index recommendations

After performing bulk loads, it is recommended to rebuild the spatial index.

```sql
-- Rebuild a spatial index, e.g., after bulk loads
ALTER INDEX polygons3d_geom_sidx REBUILD;
```

## Query spatial data

Spatial operators, procedures, and functions are used to efficiently query spatial data.

The following performance-related guidelines apply to the use of spatial operators, procedures, and functions:

* If an operator and a procedure or function perform comparable operations, and if the operator satisfies your requirements, use the operator. For example, unless you need to do otherwise, use `SDO_RELATE` instead of `SDO_GEOM.RELATE`, and use `SDO_WITHIN_DISTANCE` instead of `SDO_GEOM.WITHIN_DISTANCE`.
* Starting from *Oracle AI Database 26ai*, the conditions used with operators in the `WHERE` clause of a Spatial query can be boolean expressions that evaluate to TRUE. For example, the condition `SDO_WITHIN_DISTANCE(arg1, arg2, 'distance = <some_dist_val>')` must return `TRUE` when included in the `WHERE` clause. However, the old syntax of specifying the condition in the form `SDO_WITHIN_DISTANCE(arg1, arg2, 'distance = <some_dist_val>') = 'TRUE'` (with `TRUE` in uppercase only) continues to be supported.
* With operators, use the `/*+ ORDERED */` optimizer hint if the query window comes from a table. The hint must be used hint if multiple windows come from a table.

### Spatial Operators

Oracle Spatial uses **operators** (not functions) for primary spatial predicates. Spatial operators perform most efficiently when the geometry column in the first parameter has a spatial index defined on it. The optimizer uses these operators to leverage the spatial index.

#### Topological Relationships

The spatial operator `SDO_RELATE` categorizes the topological relationship between two geometries (points, lines, polygons) using a 9-intersection model (DE-9IM).

Oracle Spatial identifies the following relationships:

| Mask | Description |
|---|---|
|`DISJOINT` | The boundaries and interiors do not intersect. |
|`TOUCH` | The boundaries intersect but the interiors do not intersect. |
|`OVERLAPBDYDISJOINT` | The interior of one object intersects the boundary and interior of the other object, but the two boundaries do not intersect. This relationship occurs, for example, when a line originates outside a polygon and ends inside that polygon. |
|`OVERLAPBDYINTERSECT` | The boundaries and interiors of the two objects intersect. |
|`EQUAL` | The two objects have the same boundary and interior. |
|`CONTAINS` | The interior and boundary of one object is completely contained in the interior of the other object. |
|`COVERS` | The boundary and interior of one object is completely contained in the interior or the boundary of the other object, their interiors intersect, and the boundary or the interior of one object and the boundary of the other object intersect. |
|`INSIDE` | The opposite of `CONTAINS`. A `INSIDE` B implies B `CONTAINS` A. |
|`COVEREDBY` | The opposite of `COVERS`. A `COVEREDBY` B implies B `COVERS` A. |
|`ON` | The interior and boundary of one object is on the boundary of the other object. This relationship occurs, for example, when a line is on the boundary of a polygon. |
|`ANYINTERACT` | The objects are non-disjoint. |

##### SDO_RELATE query examples

```sql
-- Find all stores within a district boundary polygon
SELECT
  s.store_id,
  s.store_name
FROM
  store_locations s,
  district_boundaries d
WHERE
  d.district_name = 'Bay Area'
  AND SDO_RELATE(
    s.location,          -- geometry 1 (indexed column)
    d.boundary,          -- geometry 2
    'mask=inside'        -- relationship mask
  ) = 'TRUE';

-- Find all counties that are inside or covered by the state of New York.  Combine multiple masks with a plus sign (+).
SELECT
  county,
  c.state_abrv
FROM
  us_states   s,
  us_counties c
WHERE
  s.state = 'New York'
  AND SDO_RELATE(
    c.geom,
    s.geom,
    'mask=inside+coveredby'
  ) = 'TRUE';

-- Determine the topological relationship between each pair of geometries
SELECT
  *
FROM (
  SELECT
    c.name AS city,
    s.name AS state,
    SDO_GEOM.RELATE(
      c.geom,
      'determine',
      s.geom,
      0.05
    ) relate
  FROM
    us_cities c,
    us_states s
  );
```

##### SDO_DISJOINT query examples

```sql
-- True DISJOINT but returning wrong results: Find cities that do not interact with California
SELECT
  c.city,
  c.state,
  c.geom
FROM
  us_cities c,
  us_states s
WHERE
  c.state = 'CA'
  AND SDO_RELATE(
    c.geom,
    s.geom,
    'mask=disjoint'
  ) = 'TRUE';

-- Best approach for DISJOINT: Find cities that do not interact with California
SELECT
  c.name,
  c.state,
  c.geom
FROM
  us_cities c
WHERE
  ROWID NOT IN (
    SELECT
      c.rowid
    FROM
      us_states s,
      us_cities c
    WHERE
      SDO_ANYINTERACT(
        c.geom,
        s.geom
      ) = 'TRUE'
      AND c.state = 'CA'
  );
```

##### SDO_TOUCH query examples

```sql
SELECT
  s2.name AS state
FROM
  us_states s1,
  us_states s2
WHERE
  s1.name = 'California'
  AND SDO_RELATE(
    s2.geom,
    s1.geom,
    'mask=touch'
  ) = 'TRUE';

SELECT
  s2.name AS state
FROM
  us_states s1,
  us_states s2
WHERE
  s1.name = 'California'
  AND sdo_touch(
    s2.geom,
    s1.geom
  );
```

##### SDO_ANYINTERACT query examples

```sql
-- ANYINTERACT: Find any geometries that TOUCH, OVERLAP, or CONTAIN each other
SELECT
  s.store_id,
  s.store_name
FROM
  store_locations s,
  flood_zones f
WHERE
  f.risk_level = 'HIGH'
  AND SDO_RELATE(
    s.location,
    f.boundary,
    'mask=anyinteract'
  ) = 'TRUE';

SELECT
  s.store_id,
  s.store_name
FROM
  store_locations s,
  flood_zones f
WHERE
  f.risk_level = 'HIGH'
  AND SDO_ANYINTERACT(
    s.location,
    f.boundary
  );
```

##### OVERLAPBDYINTERSECT query examples

```sql
SELECT
  *
FROM
  parcel_map p,
  utility_lines u
WHERE
  SDO_RELATE(
    p.geom,
    u.geom,
    'mask=overlapbdyintersect'
  ) = 'TRUE';

SELECT
  *
FROM
  parcel_map p,
  utility_lines u
WHERE
  SDO_OVERLAPBDYINTERSECT(
    p.geom,
    u.geom
  );
```

##### SDO_CONTAINS query examples

```sql
-- Find all stores that are contained in a territory
SELECT
  s.store_id,
  s.store_name
FROM
  store_locations s,
  sales_territories t
WHERE
  t.territory_id = 7
  AND SDO_CONTAINS(
    t.boundary,
    s.location
  ) = 'TRUE';
```

##### SDO_INSIDE query examples

```sql
-- Find the territory in which a store is located. SDO_INSIDE is the reverse of SDO_CONTAINS.
SELECT
  t.territory_name
FROM
  store_locations s,
  sales_territories t
WHERE
  s.store_id = 42
  AND SDO_INSIDE(
    s.location,
    t.boundary
  ) = 'TRUE';

-- Find all counties inside Colorado
SELECT
  county,
  c.state
FROM
  us_states s,
  us_counties c
WHERE
  s.state = 'Colorado'
  AND sdo_inside(
    c.geom,
    s.geom
  ) = 'TRUE';
```

##### SDO_OVERLAPS query examples

```sql
-- Find all parks that overlap the state of Wyoming
SELECT
  p.name
FROM
  us_parks  p,
  us_states s
WHERE
  s.state = 'Wyoming'
  AND sdo_overlaps(
    p.geom,
    s.geom
  ) = 'TRUE'
ORDER BY
  p.name;
```

#### Spatial joins

`SDO_JOIN` is a table function that performs a spatial join based on one or more topological relationships. It is recommended to use when full table scans are performed.

Notes:

* The two geometries columns must have the same SRID value and the same number of dimensions.
* For best performance, use the /*+ ORDERED */ optimizer hint, and specify the SDO_JOIN table function first in the FROM clause.

##### SDO_JOIN query examples

```sql
BEGIN
  FOR j IN (
    SELECT
      *
    FROM
      TABLE(
        SDO_JOIN(
          'US_CITIES',           -- Name of the first table to be used in the spatial join operation
          'LOCATION',            -- Name of the SDO_GEOMETRY column in the first table. It must have an R-Tree index.
          'US_COUNTIES',         -- Name of the second table to be used in the spatial join operation
          'GEOM',                -- Name of the SDO_GEOMETRY column in the second table. It must have an R-Tree index.
          'MASK=ANYINTERACT'     -- Masking operator for the topological relationship
        )
      )
  )
  LOOP
    UPDATE
      us_cities ci
    SET
      county_id = (
        SELECT
          id
        FROM
          us_counties co
        WHERE
          co.rowid = j.rowid2
      )
    WHERE
      ci.rowid = j.rowid1;
  END LOOP;
END;
/


#### Proximity Search

The `SDO_WITHIN_DISTANCE` operator identifies spatial objects that are within some specified distance of a given object, such as an area of interest or point of interest.

##### SDO_WITHIN_DISTANCE query examples

```sql
-- Find stores within 5 km of a given point (e.g., customer location)
SELECT
  s.store_id,
  s.store_name,
  s.city
FROM
  store_locations s
WHERE
  SDO_WITHIN_DISTANCE(
    s.location,              -- spatially indexed geometry
    SDO_GEOMETRY(
      2001,
      4326,
      SDO_POINT_TYPE(
        -122.4000,
        37.7700,
        NULL),
      NULL,
      NULL
    ),                       -- query point
    'distance=5 unit=km'     -- distance specification
) = 'TRUE';

-- Similar query that orders the results by the actual distance
SELECT
  s.store_id,
  s.store_name,
  SDO_GEOM.SDO_DISTANCE(
      s.location,
      SDO_GEOMETRY(
        2001,
        4326,
        SDO_POINT_TYPE(
          -122.4000,
          37.7700,
          NULL),
        NULL,
        NULL
      ),
      0.001,              -- tolerance
      'unit=km'
  ) AS distance_km
FROM
  store_locations s
WHERE
  SDO_WITHIN_DISTANCE(
    s.location,
    SDO_GEOMETRY(
      2001,
      4326,
      SDO_POINT_TYPE(
        -122.4000,
        37.7700,
        NULL),
      NULL,
      NULL
    ),
    'distance=5 unit=km'
  ) = 'TRUE'
ORDER BY
  distance_km;

-- Find cities within distance from interstate
SELECT
  c.city,
  c.state,
  c.geom
FROM
  us_interstates i,
  us_cities c
WHERE
  i.interstate = 'I275'
  AND SDO_WITHIN_DISTANCE(
    c.geom,
    i.geom,
    'distance=15 unit=mile'
  ) = 'TRUE';

-- Find cities NOT within distance from interstate: correct results, but inefficient
SELECT
  c.city,
  c.state,
  c.geom
FROM
  us_interstates i,
  us_cities c
WHERE
  i.interstate = 'I275'
  AND sdo_within_distance (
    c.geom,
    i.geom,'distance=15 unit=mile'
  ) <> 'TRUE';

-- Find cities NOT within distance from interstate: better approach
SELECT
  c.city,
  c.state,
  c.geom
FROM
  us_cities c
WHERE
  ROWID NOT IN (
  SELECT
    c.rowid
  FROM
    us_interstates i,
    us_cities c
    WHERE
      i.interstate = 'I275'
      AND sdo_within_distance (
        c.geom,
        i.geom,
        'distance=15 unit=mile'
        ) = 'TRUE'
 );

-- Cities within 15 miles and 30 miles from interstate - first option
SELECT
  *
FROM
  (
    SELECT
      c.city,
      c.state,
      SDO_GEOM.SDO_DISTANCE(
        c.geom,
        i.geom, 0.5,
        'unit=mile') distance
    FROM
      us_interstates i,
      us_cities c
    WHERE
      i.interstate = 'I275'
      AND SDO_WITHIN_DISTANCE(
        c.geom,
        i.geom,
        'distance=30 unit=mile'
      ) = 'TRUE'
  )
WHERE
  distance >= 15
ORDER BY
  distance;

-- Cities within 15 miles and 30 miles from interstate - another option
SELECT
  c.city,
  c.state,
  SDO_GEOM.SDO_DISTANCE(
    c.geom,
    i.geom,
    0.5,
    'unit=mile'
  ) distance
FROM
  us_interstates i,
  us_cities c
WHERE
  i.interstate = 'I275'
  AND SDO_WITHIN_DISTANCE(
    c.geom,
    i.geom,
    'distance=30 unit=mile'
  ) = 'TRUE'
  AND SDO_GEOM.SDO_DISTANCE(
    c.geom,
    i.geom,
    0.5, 'unit=mile'
  ) >= 15
ORDER BY
  distance;
```

#### Point-In-Polygon searches

The parallel-enabled Point-In-Polygon table function is the optimized approach to find points in polygons. It takes an arbitrary set of rows whose first column is a point’s x-coordinate value and the second column is a point’s y-coordinate value and returns the rows that match the selection criteria.

```sql
-- List all cities and the states in which they are located
SELECT /*+ parallel(2) */
  t.name AS city,
  s.name AS state,
  t.pt_long,
  t.pt_lat,
  t.id
FROM
  us_states s,
  TABLE(
    SDO_POINTINPOLYGON(
      CURSOR (
        SELECT
          c.geom.sdo_point.x AS pt_long,
          c.geom.sdo_point.y AS pt_lat,
          id,
          name
        FROM
          us_cities c
      ),
      s.geom,
      0.05
    )
  ) t;

-- List all cities in Wisonsin
SELECT /*+ parallel(2) */
  t.name AS city,
  s.name AS state,
  t.pt_long,
  t.pt_lat,
  t.id
FROM
  us_states s,
  TABLE(
    SDO_POINTINPOLYGON(
      CURSOR (
        SELECT
          c.geom.sdo_point.x AS pt_long,
          c.geom.sdo_point.y AS pt_lat,
          id,
          name
        FROM
          us_cities c
      ),
      s.geom,
      0.05
    )
  ) t
WHERE
  s.name = 'Wisconsin'
```

#### Nearest neighbor search

```sql
-- Find the five nearest cities to the boundaries of California. This query returns 5 random cities in California.
SELECT
  c.city,
  c.state
FROM
  us_states s,
  us_cities c
WHERE
  s.state = 'California'
  AND SDO_NN(
    c.geom,
    s.geom,
    'sdo_num_res=5'
  ) = 'TRUE';

-- Find the five nearest cities to the boundaries of California. This query returns the right results.
SELECT
  c.city,
  c.state
FROM
  us_states s,
  us_cities c
WHERE
  s.state = 'California'
  AND SDO_NN(
    c.geom,
    s.geom,
    'sdo_batch_size=0',
    1                         -- correlation number (must match SDO_NN_DISTANCE ancillary operator)
  ) = 'TRUE'
  AND SDO_NN_DISTANCE(1) > 0  -- Ancillary operator in the ORDER BY clause to have the results returned in distance order
  AND ROWNUM <= 5;

-- Find the 3 nearest stores to a customer location
SELECT
  s.store_id,
  s.store_name,
  SDO_NN_DISTANCE(1) AS distance_meters
FROM
  store_locations s
WHERE
  SDO_NN(
    s.location,
    SDO_GEOMETRY(
      2001,
      4326,
      SDO_POINT_TYPE(
        10.256,
        53.653,
        NULL
      ),
      NULL,
      NULL
    ),
    'sdo_num_res=3 unit=meter',
    1
) = 'TRUE'
ORDER BY
  distance_meters;

-- SDO_NN with additional filter (stores that are open)
SELECT
  s.store_id,
  s.store_name,
  SDO_NN_DISTANCE(1) AS distance
FROM
  store_locations s
WHERE
  SDO_NN(
    s.location,
    SDO_GEOMETRY(
      2001,
      4326,
      SDO_POINT_TYPE(
        10.256,
        53.653,
        NULL
      ),
      NULL,
      NULL
    ),
    'sdo_num_res=10',
    1
  ) = 'TRUE'
  AND is_open = 'Y'
ORDER BY
  distance
FETCH FIRST 3 ROWS ONLY;
```

### Spatial functions and procedures

The `SDO_GEOM` package contains subprograms for working with geometries. They can be categorized into:

* Relationship (True/False) between two geometries, such as `SDO_GEOM.RELATE`, or `SDO_GEOM.WITHIN_DISTANCE`
* Validate and rectify geometries, such as `SDO_GEOM.VALIDATE_GEOMETRY_WITH_CONTEXT`, `SDO_GEOM.VALIDATE_LAYER_WITH_CONTEXT`, `SDO_UTIL.RECTIFY_GEOMETRY` or `SDO_GEOM.SDO_SELF_UNION`
* Single-geometry operations, such as `SDO_GEOM.SDO_CENTROID`, `SDO_GEOM.SDO_POINTONSURFACE`, or `SDO_GEOM.SDO_VOLUME`
* Two-geometry operations, such as `SDO_GEOM.SDO_DISTANCE`, `SDO_GEOM.SDO_UNION`, `SDO_GEOM.SDO_DIFFERENCE`, or `SDO_GEOM.SDO_MAXDISTANCE`

#### Validate and fix geometries

Geometries stored in the Oracle Database have to be compliant to the Open Geospatial Consortium simple features specification.  All geometry data should be validated. Any validation errors should be fixed before performing any spatial operations on the data. The recommended procedure for validating spatial data is as follows:

* Use `SDO_GEOM.VALIDATE_GEOMETRY_WITH_CONTEXT` or `SDO_GEOM.VALIDATE_LAYER_WITH_CONTEXT` procedure on all spatial data loaded into the database.
* For any geometries that are invalid, use `SDO_UTIL.RECTIFY_GEOMETRY` to fix them.

`SDO_UTIL.RECTIFY_GEOMETRY` typically corrects the most common errors, such as duplicate points, polygon orientation errors, or polygon construction errors. However, any error may, in turn, hide other errors, which the function is not designed to correct.

Here is what happens behind the scenes:

* The function validates the geometry.
* If correct, it returns it unchanged.
* If it detects one of the known errors, it tries to correct it.
* If it detects any uncorrectable error, it fails with an exception.
* It repeats the process until there are no more errors or it finds an uncorrectable error.

##### Example to validate geometries and fix invalid geometry

```sql
DECLARE
-- Declare a custom exception for uncorrectable geometries
-- "ORA-13199: the given geometry cannot be rectified"
  cannot_rectify EXCEPTION;
  PRAGMA exception_init(cannot_rectify, -13199);
  v_geometry_fixed SDO_GEOMETRY;
BEGIN
  -- Process the invalid geometries
  FOR e IN (
    SELECT
      rowid,
      geometry
    FROM
      us_counties
    WHERE
      SDO_GEOM.VALIDATE_GEOMETRY_WITH_CONTEXT(
        geometry,
        0.05
      ) <> 'TRUE'
  )
  LOOP
  -- Try and rectify the geometry. Throws an exception if it cannot be corrected.
  BEGIN
    v_geometry_fixed := SDO_UTIL.RECTIFY_GEOMETRY(e.geometry, 0.05);

    EXCEPTION
      WHEN cannot_rectify THEN
        v_geometry_fixed := NULL;
    END;

    IF v_geometry_fixed IS NOT NULL THEN
      -- Update the base table with the rectified geometry
      UPDATE
        us_counties
      SET
        geometry = v_geometry_fixed
      WHERE
        rowid = e.rowid;

      DBMS_OUTPUT.PUT_LINE('Successfully corrected the invalid geometry with rowid=' || e.rowid);
    ELSE
      dbms_output.put_line('*** Unable to correct the invalid geometry with rowid=' || e.rowid);
    END IF;

    COMMIT;
  END LOOP;
END;
/

-- Validate geometry before insert
DECLARE
  v_result VARCHAR2(100);
BEGIN
  v_result := SDO_GEOM.VALIDATE_GEOMETRY_WITH_CONTEXT(
    SDO_GEOMETRY(
      2003,
      4326,
      NULL,
      SDO_ELEM_INFO_ARRAY(1, 1003, 1),
      SDO_ORDINATE_ARRAY(0,0, 1,0, 1,1, 0,1, 0,0)
    ),
    0.001
  );
  IF v_result != 'TRUE' THEN
    RAISE_APPLICATION_ERROR(-20010, 'Invalid geometry: ' || v_result);
  END IF;
END;
/
```

#### Measure single geometries

```sql
-- Return the volume of a solid geometry
SELECT
  p.id,
  SDO_GEOM.SDO_VOLUME(p.geometry, 0.005)
FROM
  polygons3d p
WHERE
  p.id = 12;

-- Return the perimeter of a county in kilometers
SELECT
  c.county,
  SDO_GEOM.SDO_LENGTH(c.geometry, m.diminfo, 'unit=km') AS perimeter_km
FROM
  us_counties c,
  user_sdo_geom_metadata m
WHERE
  c.county = 'Kauai'
  AND m.table_name = 'US_COUNTIES'
  AND m.column_name = 'GEOMETRY'

-- Find the length in miles of a river in each county it traverses
SELECT
  c.county,
  c.state,
  SDO_GEOM.SDO_LENGTH(
    SDO_GEOM.SDO_INTERSECTION(
      c.geom,
      r.geom,
      0.5
    ),
    0.5,
    'unit=km'
  ) length
FROM
  us_counties c,
  us_rivers r
WHERE
  SDO_ANYINTERACT (c.geom, r.geom) = 'TRUE'
  AND r.name = 'North Platte';

-- Find the length in miles of a river in each county it traverses and roll it up by state
SELECT
  c.state,
  SUM(
    SDO_GEOM.SDO_LENGTH(
      SDO_GEOM.SDO_INTERSECTION(
        c.geom,
        r.geom,
        0.5
      ),
      0.5,
      'unit=km'
    )
  ) length
FROM
  us_counties c,
  us_rivers r
WHERE
  SDO_ANYINTERACT(c.geom, r.geom) = 'TRUE'
  AND r.name = 'North Platte'
GROUP BY
  ROLLUP(c.state);

-- Return the centroid of a county
SELECT
  c.county,
  c.state,
  SDO_GEOM.SDO_CENTROID(c.geometry, m.diminfo) AS centroid_pt
FROM
  us_counties c,
  user_sdo_geom_metadata m
WHERE
  c.county = 'Orange'
  AND m.table_name = 'US_COUNTIES'
  AND m.column_name = 'GEOMETRY'
ORDER BY
  c.state;
```

#### Measure two geometries

```sql
-- Calculate distance between two points
SELECT
  SDO_GEOM.SDO_DISTANCE(
    SDO_GEOMETRY(
      2001,
      4326,
      SDO_POINT_TYPE(-122.4194, 37.7749, NULL),
      NULL,
      NULL
    ),
    SDO_GEOMETRY(
      2001,
      4326,
      SDO_POINT_TYPE(-118.2437, 34.0522, NULL),
      NULL,
      NULL
    ),
    0.001,         -- tolerance
    'unit=km'
) AS sf_to_la_km
FROM
  DUAL;
```

#### Aggregate geometries

```sql
-- Union of two geometries
SELECT
  SDO_GEOM.SDO_UNION(geom_a, geom_b, 0.001) AS aggr_geom
FROM (
  SELECT
    a.boundary AS geom_a,
    b.boundary AS geom_b
  FROM
    sales_territories a,
    sales_territories b
  WHERE
    a.territory_id = 1
    AND b.territory_id = 2
  );

-- Intersection of two geometries
SELECT
  SDO_GEOM.SDO_INTERSECTION(
    polygon_a,
    polygon_b,
    0.001
  ) AS intersect_geom
FROM
  geometry_pairs;

-- How much space does Yellowstone National Park occupy in each state?
SELECT
  s.state,
  SDO_GEOM.SDO_AREA(
    SDO_GEOM.SDO_INTERSECTION(
      s.geom,
      p.geom,
      0.5
    ),
    0.5,
    'unit=sq_km'
  ) area
FROM
  us_states s,
  us_parks p
WHERE
  SDO_ANYINTERACT(s.geom, p.geom) = 'TRUE'
  AND p.name = 'Yellowstone NP'
ORDER BY
  area DESC;

-- What percentage of Yellowstone National Park lies in each state ?
WITH p AS (
  SELECT
    s.state,
    SDO_GEOM.SDO_AREA(
      SDO_GEOM.SDO_INTERSECTION(
        s.geom,
        p.geom,
        0.5
      ),
      0.5,
      'unit=sq_km'
    ) area
  FROM
    us_states s,
    us_parks p
  WHERE
    SDO_ANYINTERACT(s.geom, p.geom) = 'TRUE'
    AND p.name = 'Yellowstone NP'
  )
SELECT
  state,
  area,
  RATIO_TO_REPORT(area) OVER () * 100 AS pct
FROM
  p
ORDER BY
  pct DESC;

-- Return the topological difference of two geometries.
SELECT
  SDO_GEOM.SDO_DIFFERENCE(
    s.geom,
    m1.diminfo,
    p.geom,
    m2.diminfo
  )
FROM
  us_parks p,
  us_states s,
  user_sdo_geom_metadata m1,
  user_sdo_geom_metadata m2
WHERE
  m1.table_name = 'US_PARKS'
  AND m.column_name = 'GEOM'
  AND m2.table_name = 'US_STATES'
  AND m.column_name = 'GEOM'
  AND p.name = 'Yellowstone NP'
  AND s.name = 'Wyoming';
```

## Getting started

Here is the sample workflow to walk through before querying the data:

1. Create two spatial tables, one for point geometries and one for polygons.
2. Populate the tables with sample data.
3. Register the spatial metadata.
4. Validate the geometries.
5. Create the spatial indexes.

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
CREATE INDEX LOCATIONS_LOCATION_SIDX ON locations(location) INDEXTYPE IS MDSYS.SPATIAL_INDEX_V2 PARAMETERS ('layer_gtype=POINT');
CREATE INDEX AREAS_GEOM_SIDX ON areas(geom) INDEXTYPE IS MDSYS.SPATIAL_INDEX_V2;
```

## Working with standard spatial data formats

### GeoJSON integration

```sql
-- Convert SDO_GEOMETRY to GeoJSON
SELECT
  SDO_UTIL.TO_GEOJSON(location) AS geojson
FROM
  store_locations
WHERE
  store_id = 1;
-- Returns: {"type":"Point","coordinates":[-122.4194,37.7749]}

-- Convert GeoJSON to SDO_GEOMETRY
SELECT
  SDO_UTIL.FROM_GEOJSON(
    '{"type":"Point","coordinates":[-122.4194,37.7749]}'
  ) AS location
FROM DUAL;

-- Full feature collection for REST API
SELECT
  JSON_ARRAYAGG(
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
FROM
  store_locations;

-- Generate a GeoJSON feature collection from SDO_GEOMETRY
SELECT
  JSON_OBJECT (
    'type' VALUE 'FeatureCollection',
    'features' VALUE JSON_ARRAYAGG (
      JSON_OBJECT (
        'type' VALUE 'Feature',
        'properties' VALUE JSON_OBJECT (
          'CODST'     VALUE codst,
          'NUME'      VALUE nume,
          'CMR'       VALUE cmr,
          'JUDET'     VALUE judet,
          'LAT'       VALUE lat,
          'LONG_SGCV' VALUE long_sgcv
        ),
        'geometry' VALUE G.GEOM.GET_GEOJSON() FORMAT JSON RETURNING CLOB
      ) RETURNING CLOB
    ) RETURNING CLOB
  ) AS "{}json_document"
FROM
  meteo_stations g;
```

## Common ORA error messages

| Error code | Description |
|---|---|
| ORA-13349 | Polygon boundary crosses itself |
| ORA-13356 | Duplicate vertices |
| ORA-13367 | Wrong orientation for interior/exterior rings |
| ORA-13350 | Two or more rings of a complex polygon touch |
| ORA-13351 | Two or more rings of a complex polygon overlap |
| ORA-13353 | The ELEM_INFO_ARRAY in an SDO_GEOMETRY definition has more or fewer elements than expected |
| ORA-13354 | Incorrect offset in ELEM_INFO_ARRAY |
| ORA-13354 | SDO_ORDINATE_ARRAY not grouped by number of dimensions specified |
| ORA-13236 | Internal error in R-tree processing: [SDO_Join in active txns not supported] |

## Best Practices

* **Validate all geometries** after load, update and fix any validation errors before perforing any operations on the data, such as creating a spatial index.
* **Always register `USER_SDO_GEOM_METADATA`** before creating a spatial index. The metadata defines the valid coordinate extent and tolerance.
* **Use WGS84 (SRID=4326)** for general-purpose geographic data (GPS coordinates). Use projected coordinate systems (UTM, State Plane) when precise metric distances are required.
* **Gather statistics** on tables and spatial indexes.
* **Set tolerance appropriately**: ~0.00001 degrees (≈1 meter) for geographic data, 0.001 for projected data in meters. Too tight a tolerance causes false "not equal" results; too loose conflates nearby features.
* **Use spatial operators (`SDO_RELATE`, `SDO_NN`)** in WHERE clauses — not spatial functions (`SDO_GEOM.*`) — to leverage the spatial index.
* To optimize the performance of spatial operator, set the database system parameter **SPATIAL_VECTOR_ACCELERATION** to TRUE. It is also the recommended default value.
* **Pre-compute common distances** for frequently compared geometry pairs and store them as regular NUMBER columns with B-tree indexes.
* **Use `SDO_NN` for nearest-neighbor queries** rather than `SDO_WITHIN_DISTANCE` with large radii, which scans more of the index.
* **Partition large spatial tables** by geographic region (e.g., by state or country) to enable partition pruning in spatial queries.
* A **composite B-tree spatial index** is used for fast spatial query performance on point data. It also improves the performance for spatial index creation and when performing concurrent DML on spatial data.

## Common Mistakes

### Mistake 1: Creating spatial index without metadata

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

Using a very small tolerance (e.g., 0.000001) with projected coordinates in meters (where units are large numbers) causes nearly every operation to return unexpected results. Match the tolerance value to the unit scale of the SRID.

### Mistake 6: Using SDO_JOIN on tables with a CBTree spatial index

The SDO_JOIN operator is not supported when a composite B-tree spatial index is used.

### Mistake 7: Delete or modify any Oracle-supplied information

Do not modify or delete any Oracle-supplied information in any of the tables or views that are used for coordinate system support. This includes all objects owned by the database user `MDSYS`.

## Oracle Version Notes (19c vs 26ai)

* Baseline guidance in this file is valid for Oracle Database 19c unless a newer minimum version is explicitly called out.
* Features marked as 21c, 23c, or 23ai should be treated as Oracle Database 26ai-capable features; keep 19c-compatible alternatives for mixed-version estates.
* For dual-support environments, test syntax and package behavior in both 19c and 26ai because defaults and deprecations can differ by release update.

## Sources

### Oracle Documentation

* [Oracle Database 19c, Spatial Developer's Guide](https://docs.oracle.com/en/database/oracle/oracle-database/19/spatl/)
* [Oracle AI Database 26ai, Spatial Developer's Guide](https://docs.oracle.com/en/database/oracle/oracle-database/26/spatl/)
* [Oracle Database Error Messages](https://docs.oracle.com/en/error-help/db/ora-index.html)
* [Use Oracle Spatial with Autonomous AI Database](https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/spatial-autonomous-database.html)
