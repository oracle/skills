# Linear Referencing System (LRS) in Oracle Spatial

## Overview

Linear referencing associates attributes or events to locations along a linear feature using a single parameter — the **measure** — instead of two coordinates (longitude/latitude or x/y). It is widely used in transportation (highways, railroads, transit routes) and utilities (gas and oil pipelines) applications.

The advantage of linear referencing is that sections of a linear feature can be referenced and created **dynamically** by indicating start and end measures along the feature, without explicitly storing their coordinates. This is called **dynamic segmentation**.

The Oracle Spatial **LRS API** (the `SDO_LRS` package) provides server-side linear referencing at the cartographic level. Linear measure information is integrated directly into the `SDO_GEOMETRY` structure, and the API serves as a foundation for third-party or middle-tier applications implementing virtually any linear referencing method or model in any coordinate system.

---

## Core LRS Terms and Concepts

### Geometric Segments (LRS Segments)

A **geometric segment** is the basic LRS element. It can be:

- A **line string** — an ordered, nonbranching, continuous geometry (e.g., a simple road)
- A **multiline string** — nonconnected line strings (e.g., a highway with a gap caused by a lake or bypass road)
- A **polygon** (e.g., a racetrack or a scenic tour route that starts and ends at the same point)

A geometric segment must contain at least start and end measures for its start and end points. Measures for other points of interest (e.g., highway exits) can also be assigned, either by the user or derived automatically. Points on a geometric segment are represented as triplets `(x, y, m)`, where `x`/`y` describe location and `m` denotes the measure.

### Shape Points

**Shape points** are points specified when an LRS segment is constructed and assigned measure information. A line segment is represented by its start and end points; an arc is represented by three points (start, middle, end). You can also designate other points as shape points to store measure information for them (e.g., a highway exit).

Shape points serve to indicate the direction of the segment (turns/curves) and/or to identify a point of interest whose measure should be stored. They do not necessarily correspond to mileposts or reference posts. Measures of shape points are automatically populated when the segment is defined with `SDO_LRS.DEFINE_GEOM_SEGMENT`.

### Direction of a Geometric Segment

**Direction** runs from the start point to the end point, determined by the order of vertices in the geometry definition. Measures of points on a geometric segment always either increase or decrease along that direction.

### Measure (Linear Measure)

The **measure** of a point along a geometric segment is the linear distance (in the measure dimension) from the start point (for increasing values) or end point (for decreasing values). Measure does not have to be on the same scale as physical distance, but the linear mapping relationship between measure and distance is always preserved.

Some LRS functions use **offset** instead of measure — these are different concepts in Oracle Spatial (see below).

### Offset

The **offset** of a point along a geometric segment is the perpendicular distance between the point and the segment. Offsets are:

- **Positive** if the point is on the left side of the segment direction
- **Negative** if on the right side
- **Zero** if the point lies on the segment

The offset's unit of measurement matches the coordinate system of the segment; for geodetic data the default unit is meters. A point can be located along a segment using a `(measure, offset)` pair — this locates not only points on the segment but also points perpendicular to it.

### Measure Populating

Any unassigned (`NULL`) measures of shape points on a geometric segment are automatically populated based on distance distribution before any LRS operation runs. The measure of a point is derived via linear mapping between its nearest previous and next known measures/locations. Assigned measures for points of interest **do not need to be evenly spaced** and do not even need to reflect actual distances (e.g., they could reflect estimated driving time) — any valid value within the measure range is acceptable. Measure populating is always done incrementally along the segment direction.

### Measure Range of a Geometric Segment

The start and end measures of a geometric segment define its linear **measure range**. Any valid LRS measure for the segment must fall within this range.

### Projection

The **projection** of a point along a geometric segment is the point on the segment with minimum distance to the specified point; the resulting point geometry also carries the corresponding measure.

### LRS Point

An **LRS point** is a point geometry with measure information. Unlike ordinary points, **all LRS point data must be stored in `SDO_ELEM_INFO_ARRAY` and `SDO_ORDINATE_ARRAY`** — it cannot be stored in the `SDO_POINT` attribute of `SDO_GEOMETRY`.

### Linear Features

A **linear feature** is any spatial object treated as a logical set of linear segments (e.g., a highway made up of multiple geometric segments, or a pipeline). A single linear feature can consist of multiple geometric segments, each potentially carrying multiple LRS points.

### Measures with Multiline Strings and Polygons with Holes

For a multiline string or a polygon-with-hole LRS geometry, `SDO_LRS.DEFINE_GEOM_SEGMENT` and `SDO_LRS.CONVERT_TO_LRS_GEOM` by default assign the **same measure value** to the end point of one sub-segment and the start point of the next (across the gap), even though you can later reassign different values. This means duplicate measure values can exist across segments by default.

When an LRS function must resolve a duplicate measure, it uses the **first point with that measure**, except when doing so would produce an invalid geometry. For example, if a multiline string's first sub-segment spans measures 0–100 and the second spans 100–150:

- `SDO_LRS.LOCATE_PT` at measure 100 returns the point in the **first** sub-segment.
- `SDO_LRS.CLIP_GEOM_SEGMENT` / `SDO_LRS.DYNAMIC_SEGMENT` / `SDO_LRS.OFFSET_GEOM_SEGMENT` between measures 75 and 125 returns a multiline string of two pieces.
- The same functions between measures 100 and 125 **ignore** the point at measure 100 in the first sub-segment and return a line string along the **second** sub-segment only.

---

## LRS Data Model

Measure information is integrated directly into the Oracle Spatial model by adding an extra **measure dimension** to the spatial metadata. This affects both the metadata (`USER_SDO_GEOM_METADATA`) and the geometry data itself.

### SDO_GTYPE Values Used with LRS

| SDO_GTYPE | Meaning |
|---|---|
| `3301` | 2D LRS point (X, Y, M) — required GTYPE for any point geometry used with an LRS function |
| `3302` | 2D LRS line string (X, Y, M) |
| `3401` | 3D LRS point (X, Y, Z, M), as required by `_3D`-format LRS functions such as `SDO_LRS.PROJECT_PT_3D` |

Whenever a geometric segment is defined, its start and end measures must be defined (or derived from an existing geometric segment); unassigned measures of intermediate shape points are populated automatically.

```sql
-- Sample LRS geometry - highway route with six exits
SDO_GEOMETRY(
  3302,  -- 2D LRS line string (X, Y, M)
  NULL,
  NULL,
  SDO_ELEM_INFO_ARRAY(1,2,1), -- one line string, straight segments
  SDO_ORDINATE_ARRAY(
    2,2,0,       -- Start point - Exit1; 0 is measure from start.
    2,4,2,       -- Exit2; 2 is measure from start.
    8,4,8,       -- Exit3; 8 is measure from start.
    12,4,12,     -- Exit4; 12 is measure from start.
    12,10,NULL,  -- Not an exit; measure automatically calculated and filled.
    8,10,22,     -- Exit5; 22 is measure from start.
    5,14,27      -- End point (Exit6); 27 is measure from start.
  )
)
```

The measure dimension **must be the last element** of the `SDO_DIM_ARRAY` in the spatial object's metadata definition.

```sql
-- Adding an M (measure) dimension to metadata for an LRS geometry column
INSERT INTO user_sdo_geom_metadata (table_name, column_name, diminfo, srid)
  VALUES (
    'LRS_ROUTES',
    'GEOMETRY',
    SDO_DIM_ARRAY(
      SDO_DIM_ELEMENT('X', 0, 20, 0.005),
      SDO_DIM_ELEMENT('Y', 0, 20, 0.005),
      SDO_DIM_ELEMENT('M', 0, 100, 0.005)
    ),   -- measure dimension, must be last
    NULL
  );
```

---

## Indexing of LRS Data

If LRS data has four dimensions (three spatial plus the M dimension) and you need to index all three non-measure dimensions, you must use a **spatial R-tree index**, specifying `PARAMETERS('sdo_indx_dims=3')` in the `CREATE INDEX` statement so the first three dimensions (not the measure) are indexed:

```sql
CREATE INDEX lrs_routes_idx ON lrs_routes(route_geometry)
  INDEXTYPE IS MDSYS.SPATIAL_INDEX_V2
  PARAMETERS('sdo_indx_dims=3');
```

- The default value of `sdo_indx_dims` is **2** (only the first two dimensions are indexed).
- If you specify `sdo_indx_dims` of 3 or higher, only the spatial operators documented for three-dimensional objects can be used on the indexed geometries — other (2D-only) spatial operators cannot.
- **Do not include the measure (M) dimension in a spatial index** — it adds processing overhead with no benefit.

---

## 3D Formats of LRS Functions

Most LRS functions have a companion format ending in **`_3D`** — for example `DEFINE_GEOM_SEGMENT_3D`, `CLIP_GEOM_SEGMENT_3D`, `FIND_MEASURE_3D`, and `LOCATE_PT_3D`.

- `_3D` formats are supported **only for line string and multiline string** geometries — not for polygons, arcs, or circles.
- Use the `_3D` format only when the geometry has four dimensions (X, Y, Z, M) and you want the function to consider the first three (X, Y, Z).
- If you use the **standard** (non-`_3D`) format on a four-dimensional geometry, the function considers only the first two dimensions (X, Y) and silently ignores Z.
- If an LRS function's parameters include both a line (or multiline) string and a point, **both must have the same number of dimensions**:
  - `SDO_LRS.PROJECT_PT` — 2D line (X, Y) + measure, and a 2D LRS point (`SDO_GTYPE = 3301`)
  - `SDO_LRS.PROJECT_PT_3D` — 3D line (X, Y, Z) + measure, and a 3D LRS point (`SDO_GTYPE = 3401`)

```sql
-- Considers X, Y, and Z dimensions
SELECT sdo_lrs.clip_geom_segment_3d(a.geom, m.diminfo, 5, 10)
FROM routes r, user_sdo_geom_metadata m
WHERE m.table_name = 'ROUTES' AND m.column_name = 'GEOM';

-- Considers only X and Y; Z is ignored
SELECT sdo_lrs.clip_geom_segment(a.geom, m.diminfo, 5, 10)
FROM routes r, user_sdo_geom_metadata m
WHERE m.table_name = 'ROUTES' AND m.column_name = 'GEOM';
```

---

## LRS Operations

### Defining a Geometric Segment

There are two ways to create a geometric segment with measure information:

1. Construct the geometry and assign all measures explicitly.
2. Define the geometry with start, end, and any other measures in ascending or descending order; measures of shape points left `NULL` are automatically populated from their locations and distance distribution.

An LRS segment must be defined (or already exist) before any LRS operation can proceed — start, end, and any explicitly assigned measures must be present so that locations can be derived from a specified measure.

### Redefining a Geometric Segment

`SDO_LRS.REDEFINE_GEOM_SEGMENT` replaces the existing measures of all shape points between the start and end point with automatically (proportionally) calculated measures. This is useful to correct erroneous explicit measure assignments, or to rescale a segment's measure range (see the mile-to-kilometer conversion in the worked example below).

### Clipping a Geometric Segment (Dynamic Segmentation)

You can **clip** a geometric segment to create a new geometric segment from part of an existing one — this is **dynamic segmentation**. The new segment gets its own start and end points; its direction matches the original. A typical use case is building a table of road-condition segments (e.g., measures 100–120 "good condition", 120–125 "poor condition") without physically storing each condition segment's geometry.

The functions `SDO_LRS.CLIP_GEOM_SEGMENT` and `SDO_LRS.DYNAMIC_SEGMENT` are synonymous.

### Splitting a Geometric Segment

You can create two new geometric segments by splitting one geometric segment at a measure value, using `SDO_LRS.SPLIT_GEOM_SEGMENT`. Each new segment's direction matches the original.

### Concatenating Geometric Segments

`SDO_LRS.CONCATENATE_GEOM_SEGMENTS` creates a new geometric segment by joining two geometric segments. They do not need to be spatially connected — if they are not, the result is a multiline string. The measures of the **second** segment are shifted so its start measure equals the first segment's end measure. The resulting direction is always the direction of the **first** segment (`geom_segment1` in the function call).

You can also perform **aggregate concatenation** — joining all connected geometric segments in a column (layer) at once — with the `SDO_AGGR_LRS_CONCAT` spatial aggregate function.

### Scaling a Geometric Segment

`SDO_LRS.SCALE_GEOM_SEGMENT` performs a linear scaling operation on a segment, rearranging its measures. If the scaling factor is negative, the order of shape points is reversed so measures still increase along the segment's direction. A scale operation can combine:

- **Translating** measure information (e.g., add the same value to `Ms` and `Me`) — see `SDO_LRS.TRANSLATE_MEASURE`
- **Reversing** measure information (`M's = Me`, `M'e = Ms`) — see `SDO_LRS.REVERSE_GEOMETRY`
- **Simple scaling** of measure information — see `SDO_LRS.REDEFINE_GEOM_SEGMENT`

### Offsetting a Geometric Segment

`SDO_LRS.OFFSET_GEOM_SEGMENT` creates a new geometric segment offset by a specified perpendicular distance from the original, between given start/end measures (e.g., modeling a guard rail alongside a road).

### Locating a Point on a Geometric Segment

You can find the position described by a `(measure, offset)` pair on a geometric segment with `SDO_LRS.LOCATE_PT`. There is always a unique location for a given measure with no offset. Ambiguity can arise when an offset is combined with a measure that falls exactly on a shape point: the set of equidistant points forms an "offset arc," and all points on that arc share the same `(measure, offset)` pair. Oracle Spatial resolves this by returning the **middle point** on the offset arc.

### Projecting a Point onto a Geometric Segment

`SDO_LRS.PROJECT_PT` finds the projection of an arbitrary point (on or off the segment) onto a geometric segment — the reverse of the point-locating operation. If the point is already on the segment, the point and its projection are the same. If there are multiple possible projection points, the **first one from the start point** is returned.

### Converting LRS Geometries

Geometries can be converted from standard (non-measure) line string format to LRS format, and back, using `SDO_LRS.CONVERT_TO_LRS_GEOM` and its reverse, `SDO_LRS.CONVERT_TO_STD_GEOM`. An entire layer (all geometries in a spatial column) can be converted in place with `SDO_LRS.CONVERT_TO_LRS_LAYER`:

```sql
-- Convert every geometry in US_INTERSTATES_LRS.GEOM to LRS format.
-- Measures run from 0 (start_measure) to 100000000 (end_measure, an upper bound), with tolerance 0.5. 
-- Make sure to  drop any existing spatial index on the column first.
DECLARE
  status VARCHAR2(32);
BEGIN
  status := sdo_lrs.convert_to_lrs_layer('US_INTERSTATES_LRS', 'GEOM', 0, 100000000, 0.5);
  IF status = 'TRUE'
  THEN
    dbms_output.put_line('Conversion from standard geometry to LRS layer succeeded.');
  ELSE
    dbms_output.put_line('Conversion from standard geometry to LRS layer failed.');
  END IF;
END;
/
COMMIT;

-- Recreate the spatial index after conversion.
CREATE INDEX us_interstates_lrs_sx ON us_interstates_lrs (geom)
  INDEXTYPE IS MDSYS.SPATIAL_INDEX_V2;
```

Conversion is available for:

- **Individual line strings or points** — converting to LRS format adds a measure dimension (named `M` by default) and provides per-point measure information; converting back removes it. In both directions, `DIMINFO` metadata in `USER_SDO_GEOM_METADATA` is unaffected.
- **Layers (all geometries in a column)** — converting to LRS format adds the measure dimension without per-point measures; converting back removes it. In both directions, `DIMINFO` metadata **is** modified as needed (e.g., an `M` `SDO_DIM_ELEMENT` is added).
- **Dimensional information (`DIMINFO`)** alone.

For point geometries specifically:

- Converting a **standard point to an LRS point**: the input's `SDO_POINT` attribute is used to populate `SDO_ELEM_INFO`/`SDO_ORDINATES` in the result, and the result's `SDO_POINT` is set to `NULL`.
- Converting an **LRS point to a standard point**: the input's `SDO_ELEM_INFO`/`SDO_ORDINATES` are used to populate the result's `SDO_POINT`, and the result's `SDO_ELEM_INFO`/`SDO_ORDINATES` are set to `NULL`.

---

## Tolerance Values with LRS Functions

Many LRS functions require a tolerance value or one or more dimensional arrays. You can specify a single tolerance value for all non-measure dimensions, or use the tolerance associated with each non-measure dimension in the dimensional array(s). **Tolerance applies only to the geometry (non-measure) portion of the data, never to the measure dimension.** For geodetic data the tolerance is in meters; for non-geodetic data it is in the coordinate system's unit of measurement.

For **clip** and **offset** operations: if the returned segment would have a shape point within the tolerance value of what would otherwise be its computed start or end point, that shape point is used as the start/end point instead — this avoids producing an invalid geometry with redundant vertices very close together.

If LRS results seem imprecise or incorrect, consider specifying a smaller tolerance value.

---

## Synthetic LRS Routes Example

This example creates a route with six exits, defines it as an LRS segment, and exercises the core `SDO_LRS` operations.

```sql
-- Create a table for routes (highways).
CREATE TABLE lrs_routes (
  route_id        NUMBER PRIMARY KEY,
  route_name      VARCHAR2(32),
  route_geometry  SDO_GEOMETRY
);

-- Populate table with one route.
INSERT INTO lrs_routes VALUES (
  1,
  'Route1',
  SDO_GEOMETRY(
    3302,
    NULL,
    NULL,
    SDO_ELEM_INFO_ARRAY(1,2,1),
    SDO_ORDINATE_ARRAY(
      2,2,0, 
      2,4,2,
      8,4,8,
      12,4,12,
      12,10,NULL,
      8,10,22,
      5,14,27
    )
  )
);

-- Register the LRS metadata (M dimension last).
INSERT INTO user_sdo_geom_metadata (table_name, column_name, diminfo, srid)
  VALUES (
    'lrs_routes',
    'route_geometry',
    SDO_DIM_ARRAY(
      SDO_DIM_ELEMENT('X', 0, 20, 0.005),
      SDO_DIM_ELEMENT('Y', 0, 20, 0.005),
      SDO_DIM_ELEMENT('M', 0, 20, 0.005)
    ),
    NULL
  );

-- Create the spatial index.
CREATE INDEX lrs_routes_idx ON lrs_routes(route_geometry)
  INDEXTYPE IS MDSYS.SPATIAL_INDEX_V2;

DECLARE
  geom_segment  SDO_GEOMETRY;
  line_string   SDO_GEOMETRY;
  dim_array     SDO_DIM_ARRAY;
  result_geom_1 SDO_GEOMETRY;
  result_geom_2 SDO_GEOMETRY;
  result_geom_3 SDO_GEOMETRY;
BEGIN
  SELECT a.route_geometry INTO geom_segment
  FROM lrs_routes a
  WHERE a.route_name = 'Route1';

  SELECT m.diminfo INTO dim_array
  FROM user_sdo_geom_metadata m
  WHERE m.table_name = 'LRS_ROUTES' AND m.column_name = 'ROUTE_GEOMETRY';

  -- Define the LRS segment; populates any NULL measures.
  sdo_lrs.define_geom_segment(geom_segment, dim_array);

  SELECT a.route_geometry INTO line_string
  FROM lrs_routes a
  WHERE a.route_name = 'Route1';

  -- Split Route1 into two segments at measure 5.
  sdo_lrs.split_geom_segment(line_string, dim_array, 5, result_geom_1, result_geom_2);

  -- Concatenate the segments that were just split.
  result_geom_3 := sdo_lrs.concatenate_geom_segments(
    result_geom_1,
    dim_array,
    result_geom_2,
    dim_array
  );

  UPDATE lrs_routes a SET a.route_geometry = geom_segment WHERE a.route_id = 1;
  INSERT INTO lrs_routes VALUES (11, 'result_geom_1', result_geom_1);
  INSERT INTO lrs_routes VALUES (12, 'result_geom_2', result_geom_2);
  INSERT INTO lrs_routes VALUES (13, 'result_geom_3', result_geom_3);
END;
/

-- Are result_geom_1 and result_geom_2 connected? -> TRUE
SELECT sdo_lrs.connected_geom_segments(a.route_geometry, b.route_geometry, 0.005)
FROM lrs_routes a, lrs_routes b
WHERE a.route_id = 11 AND b.route_id = 12;

-- Is Route1 a valid geometric segment? -> TRUE
SELECT sdo_lrs.valid_geom_segment(route_geometry)
FROM lrs_routes WHERE route_id = 1;

-- Full LRS geometry validation: checks the segment geometry together with its
-- measure information (dim_array is required for this check) -> TRUE
SELECT sdo_lrs.validate_lrs_geometry(a.route_geometry, m.diminfo)
FROM lrs_routes a, user_sdo_geom_metadata m
WHERE m.table_name = 'LRS_ROUTES' 
  AND m.column_name = 'ROUTE_GEOMETRY'
  AND a.route_id = 1;

-- Is 50 a valid measure on Route1? -> FALSE (highest measure is 27)
SELECT sdo_lrs.valid_measure(route_geometry, 50)
FROM lrs_routes
WHERE route_id = 1;

-- Length, start/end measure, start/end point of Route1
SELECT sdo_lrs.geom_segment_length(route_geometry)
FROM lrs_routes
WHERE route_id = 1;         -- 27

SELECT sdo_lrs.geom_segment_start_measure(route_geometry)
FROM lrs_routes
WHERE route_id = 1;         -- 0

SELECT sdo_lrs.geom_segment_end_measure(route_geometry)
FROM lrs_routes
WHERE route_id = 1;         -- 27

-- What percentage of Route1's measure range (0-27) does measure 5 represent?
-- Measure range is 27, so 5 is ~18.5185185% of it -> 18.5185185
SELECT sdo_lrs.measure_to_percentage(a.route_geometry, m.diminfo, 5)
FROM lrs_routes a, user_sdo_geom_metadata m
WHERE m.table_name = 'LRS_ROUTES'
  AND m.column_name = 'ROUTE_GEOMETRY'
  AND a.route_id = 1;

-- Translate all measures by +10 (does not persist unless assigned/updated)
SELECT sdo_lrs.translate_measure(a.route_geometry, m.diminfo, 10)
FROM lrs_routes a, user_sdo_geom_metadata m
WHERE m.table_name = 'LRS_ROUTES'
  AND m.column_name = 'ROUTE_GEOMETRY'
  AND a.route_id = 1;

-- Redefine the segment's measure range to "convert" miles to kilometers (27 mi = 43.443 km)
DECLARE
  geom_segment SDO_GEOMETRY;
  dim_array    SDO_DIM_ARRAY;
BEGIN
  SELECT a.route_geometry INTO geom_segment
  FROM lrs_routes a
  WHERE a.route_name = 'Route1';

  SELECT m.diminfo INTO dim_array 
  FROM user_sdo_geom_metadata m
  WHERE m.table_name = 'LRS_ROUTES'
    AND m.column_name = 'ROUTE_GEOMETRY';

  sdo_lrs.redefine_geom_segment(
    geom_segment,
    dim_array,
    0,       -- new start measure
    43.443   -- new end measure
  );

  UPDATE lrs_routes a
  SET a.route_geometry = geom_segment
  WHERE a.route_id = 1;
END;
/

-- Clip the piece of Route1 between measures 5 and 10
SELECT sdo_lrs.clip_geom_segment(route_geometry, 5, 10)
FROM lrs_routes
WHERE route_id = 1;

-- DYNAMIC_SEGMENT is documented as a synonym for CLIP_GEOM_SEGMENT — same
-- arguments, same result as the query above.
SELECT sdo_lrs.dynamic_segment(route_geometry, 5, 10)
FROM lrs_routes
WHERE route_id = 1;

-- Project point (9,3,NULL), which is off the road, onto Route1 -> (9,4,9)
SELECT sdo_lrs.project_pt(route_geometry,
  SDO_GEOMETRY(
    3301,
    NULL,
    NULL,
    SDO_ELEM_INFO_ARRAY(1, 1, 1),
    SDO_ORDINATE_ARRAY(9, 3, NULL)
  )
)
FROM lrs_routes
WHERE route_id = 1;

-- Locate the point on Route1 at measure 9, offset 0 -> (9,4,9)
SELECT sdo_lrs.locate_pt(route_geometry, 9, 0)
FROM lrs_routes
WHERE route_id = 1;
```

Selected results from the guide's example output:

| Query | Result |
|---|---|
| `CONNECTED_GEOM_SEGMENTS` (segments 11, 12, tolerance 0.005) | `TRUE` |
| `VALID_GEOM_SEGMENT` (Route1) | `TRUE` |
| `VALIDATE_LRS_GEOMETRY(route_geometry, diminfo)` (Route1) | `TRUE` |
| `VALID_MEASURE(route_geometry, 50)` | `FALSE` |
| `GEOM_SEGMENT_LENGTH` (Route1) | `27` |
| `GEOM_SEGMENT_START_MEASURE` / `END_MEASURE` | `0` / `27` |
| `MEASURE_TO_PERCENTAGE(route_geometry, diminfo, 5)` | `18.5185185` |
| `CLIP_GEOM_SEGMENT(route_geometry, 5, 10)` | Line string `(5,4,5), (8,4,8), (10,4,10)` |
| `DYNAMIC_SEGMENT(route_geometry, 5, 10)` | Same as `CLIP_GEOM_SEGMENT` above (synonym) |
| `PROJECT_PT` of `(9,3,NULL)` | `(9,4,9)` |
| `LOCATE_PT(route_geometry, 9, 0)` | `(9,4,9)` |

The queries below cover the remaining LRS operations (`Scaling`, `Offsetting`, `Converting`, and aggregate `Concatenating`) that are not part of the guide's continuous script above. Each is shown as documented on its own Oracle reference page, using the same `Route1` definition (the *original*, mile-based measures 0–27 — i.e., before the mile-to-kilometer `REDEFINE_GEOM_SEGMENT` step earlier in this section). Run them against `Route1` as initially defined, not after that redefinition, to reproduce these exact results.

```sql
-- SCALE_GEOM_SEGMENT: rescale Route1's measure range to 100-200, then shift
-- every resulting measure by +10 (so the start point's measure becomes 110
-- and the end point's becomes 210).
SELECT sdo_lrs.scale_geom_segment(route_geometry, 100, 200, 10)
FROM lrs_routes
WHERE route_id = 1;
-- Result: SDO_GEOMETRY(3302, NULL, NULL, SDO_ELEM_INFO_ARRAY(1, 2, 1), SDO_ORDINATE_ARRAY(
--   2, 2, 110, 2, 4, 117.407407, 8, 4, 139.62963, 12, 4, 154.444444,
--   12, 10, 176.666667, 8, 10, 191.481481, 5, 14, 210))

-- REVERSE_GEOMETRY: reverse both the direction and the measures of Route1
-- (e.g., to prepare it for concatenation with another road in the opposite direction).
SELECT sdo_lrs.reverse_geometry(a.route_geometry, m.diminfo)
FROM lrs_routes a, user_sdo_geom_metadata m
WHERE m.table_name = 'LRS_ROUTES'
  AND m.column_name = 'ROUTE_GEOMETRY'
  AND a.route_id = 1;
-- Result: SDO_GEOMETRY(3302, NULL, NULL, SDO_ELEM_INFO_ARRAY(1, 2, 1), SDO_ORDINATE_ARRAY(
--   5, 14, 27, 8, 10, 22, 12, 10, 18, 12, 4, 12, 8, 4, 8, 2, 4, 2, 2, 2, 0))
-- Measures now descend 27 -> 0; the start/end points are swapped (5,14 <-> 2,2).
-- Compare with SDO_LRS.REVERSE_MEASURE, which reverses only the measures, not the direction.

-- OFFSET_GEOM_SEGMENT: a new segment offset 2 units to the left of Route1,
-- covering only the part between measures 5 and 10.
SELECT sdo_lrs.offset_geom_segment(a.route_geometry, m.diminfo, 5, 10, 2)
FROM lrs_routes a, user_sdo_geom_metadata m
WHERE m.table_name = 'LRS_ROUTES'
  AND m.column_name = 'ROUTE_GEOMETRY'
  AND a.route_id = 1;
-- Result: SDO_GEOMETRY(3302, NULL, NULL, SDO_ELEM_INFO_ARRAY(1, 2, 1),
--   SDO_ORDINATE_ARRAY(5, 6, 5, 10, 6, 10))
-- The Y values (6) are 2 greater than the original segment's Y (4) between measures 5-10.

-- CONVERT_TO_LRS_GEOM / CONVERT_TO_STD_GEOM: round-trip Route1 between LRS
-- format and standard (non-measure) format.
SELECT sdo_lrs.convert_to_lrs_geom(a.route_geometry, m.diminfo)
FROM lrs_routes a, user_sdo_geom_metadata m
WHERE m.table_name = 'LRS_ROUTES'
  AND m.column_name = 'ROUTE_GEOMETRY'
  AND a.route_id = 1;
-- Result (as documented): SDO_GEOMETRY(3302, NULL, NULL, SDO_ELEM_INFO_ARRAY(1, 2, 1), SDO_ORDINATE_ARRAY(
--   2, 2, 0, 2, 4, 2, 8, 4, 8, 12, 4, 12, 12, 10, NULL, 8, 10, 22, 5, 14, 27))

SELECT sdo_lrs.convert_to_std_geom(a.route_geometry, m.diminfo)
FROM lrs_routes a, user_sdo_geom_metadata m
WHERE m.table_name = 'LRS_ROUTES'
  AND m.column_name = 'ROUTE_GEOMETRY'
  AND a.route_id = 1;
-- Result: SDO_GEOMETRY(2002, NULL, NULL, SDO_ELEM_INFO_ARRAY(1, 2, 1), SDO_ORDINATE_ARRAY(
--   2, 2, 2, 4, 8, 4, 12, 4, 12, 10, 8, 10, 5, 14))
-- GTYPE changes from 3302 (LRS line: X,Y,M) to 2002 (standard 2D line: X,Y);
-- the measure dimension and its values are removed entirely.

-- SDO_AGGR_LRS_CONCAT: aggregate concatenation of every LRS geometry selected
-- by the query, not just two at a time like CONCATENATE_GEOM_SEGMENTS.
-- Add a second, independent route to concatenate with Route1.
INSERT INTO lrs_routes VALUES (
  0, 'Route0',
  SDO_GEOMETRY(
    3302,
    NULL,
    NULL,
    SDO_ELEM_INFO_ARRAY(1,2,1),
    SDO_ORDINATE_ARRAY(5,14,5, 10,14,0))  -- decreasing measure, 5 down to 0
);

-- Concatenate all routes in the table (no ordering specified).
SELECT sdo_aggr_lrs_concat(sdoaggrtype(route_geometry, 0.005))
FROM lrs_routes;

-- To control the concatenation order, use a NO_MERGE subquery with ORDER BY.
-- Direction of the result follows the first row returned by the subquery.
SELECT sdo_aggr_lrs_concat(sdoaggrtype(route_geometry, 0.005))
FROM (
  SELECT /*+ NO_MERGE */ route_geometry
  FROM lrs_routes
  ORDER BY route_id
);
```

As documented, with only `Route0` and `Route1` in the table, the unordered aggregate concatenation returns `SDO_GEOMETRY(3302, NULL, NULL, SDO_ELEM_INFO_ARRAY(1, 2, 1), SDO_ORDINATE_ARRAY(2, 2, 0, 2, 4, 2, 8, 4, 8, 12, 4, 12, 12, 10, 18, 8, 10, 22, 5, 14, 27, 10, 14, 32))`, and the `ORDER BY route_id` version returns the same points with measures reversed/renumbered starting from `32`. **Note:** by this point in this section's script, `lrs_routes` also contains rows `11`, `12`, and `13` (from the split/concatenate step earlier), so running this exact query here will aggregate those rows too. Add `WHERE route_id IN (0, 1)` to reproduce the documented output exactly.

---

## Practical Example: Road Network with Dynamic Segmentation

This end-to-end example builds a real road-condition reporting workflow for interstates in Colorado, going beyond the [synthetic LRS Routes example](#synthetic-lrs-routes-example) above. It derives an LRS layer from existing (non-LRS) interstate highway geometries, models pavement condition as measure ranges, and uses dynamic segmentation to clip, report on, and visualize the results.

### 1. Building an LRS Table from Existing Geometries

The `US_STATES` dataset used in this chapter was downloaded from the [U.S. Census Cartographic Boundary Files](https://www.census.gov/geographies/mapping-files/time-series/geo/carto-boundary-file.html). The `US_INTERSTATES`and `US_COUNTIES` datasets were derived from past U.S. Census data and can be downloaded from [this GitHub repo folder](https://github.com/karinpatenge/asktom-spatial/tree/main/2026/07_LRS/data).

All datasets were loaded into the Oracle AI Database, then validated, and rectified (if needed) using [Oracle Spatial Studio](https://www.oracle.com/database/technologies/spatial-studio/get-started.html). `US_COUNTIES` and `US_INTERSTATES` were also converted to 2D geometries using `SDO_CS.MAKE_2D` to match the dimensionality of `US_INTERSTATES`.

Start from ordinary (non-LRS) interstate geometries and an ordinary state-boundary layer. Clip the interstates to the state border with `SDO_GEOM.SDO_INTERSECTION`, keeping only interstates that interact with the state:

```sql
CREATE TABLE us_interstates_lrs (
  id          NUMBER PRIMARY KEY,
  interstate  VARCHAR2(35),
  geom        SDO_GEOMETRY
);

-- Clip interstates at the Colorado border, and insert the clipped
-- geometries into US_INTERSTATES_LRS.
INSERT INTO us_interstates_lrs
  SELECT
    i.id,
    i.interstate,
    sdo_geom.sdo_intersection(
      sdo_cs.make_2d(i.geom, 4326),    -- interstates geometry converted to 2D
      sdo_cs.transform(s.geom, 4326),  -- states geometry converted to the same SRID
      0.0005                           -- tolerance
    ) geom
  FROM
    us_states s,
    us_interstates i
  WHERE
    s.stusps = 'CO'
    AND sdo_anyinteract(i.geom, s.geom) = 'TRUE';

INSERT INTO user_sdo_geom_metadata VALUES (
  'US_INTERSTATES_LRS',
  'GEOM',
  SDO_DIM_ARRAY(
    SDO_DIM_ELEMENT('X', -180, 180, 0.0005),
    SDO_DIM_ELEMENT('Y', -90, 90, 0.0005)
  ),
  4326
);

COMMIT;
```

Then convert the whole layer to LRS format with `SDO_LRS.CONVERT_TO_LRS_LAYER` (as shown in [Converting LRS Geometries](#converting-lrs-geometries)), and build the spatial index only **after** conversion — an index must not exist while the geometries are being converted.

```sql
-- Convert every geometry in US_INTERSTATES_LRS.GEOM to LRS format.
-- Make sure to  drop any existing spatial index on the column first.
-- The metadata in USER_SDO_GEOM_METADATA is automatically updated upon conversion
-- having M as third dimension.
DECLARE
  status VARCHAR2(32);
BEGIN
  status := sdo_lrs.convert_to_lrs_layer('US_INTERSTATES_LRS', 'GEOM', 0, 100000000, 0.5);
  IF status = 'TRUE'
  THEN
    dbms_output.put_line('Conversion from standard geometry to LRS layer succeeded.');
  ELSE
    dbms_output.put_line('Conversion from standard geometry to LRS layer failed.');
  END IF;
END;
/
COMMIT;

-- Verify the output
SELECT
  i.interstate,
  v.id AS vertex_no,
  v.x,
  v.y,
  v.z AS m
FROM
  us_interstates_lrs i,
  TABLE(SDO_UTIL.GETVERTICES(i.geom)) v
ORDER BY
  i.interstate,
  v.id;

-- Recreate the spatial index after conversion.
CREATE INDEX us_interstates_lrs_sx ON us_interstates_lrs (geom)
  INDEXTYPE IS MDSYS.SPATIAL_INDEX_V2;
```

### 2. Modeling Road Conditions with Measure Ranges

Pavement condition is stored independently of geometry, as `(interstate, from_measure, to_measure, condition)` rows — the essence of dynamic segmentation: condition segments are never stored as their own geometries.

```sql
CREATE TABLE us_road_conditions (
  id            NUMBER PRIMARY KEY,
  interstate    VARCHAR2(35),
  from_measure  NUMBER,
  to_measure    NUMBER,
  condition     VARCHAR2(6)
);

-- Insert sample data
INSERT INTO us_road_conditions VALUES (1, 'I25',      0, 150000, 'good');
INSERT INTO us_road_conditions VALUES (2, 'I25', 150000, 170000, 'poor');
INSERT INTO us_road_conditions VALUES (3, 'I25', 170000, 340000, 'fair');
INSERT INTO us_road_conditions VALUES (4, 'I25', 340000, 481426, 'good');
COMMIT;

CREATE INDEX us_road_conditions_idx ON us_road_conditions (interstate);
```

### 3. Dynamic Segmentation: Clipping by Condition

Join the condition table back to the LRS geometries and clip on demand with `SDO_LRS.CLIP_GEOM_SEGMENT` — the "poor" condition segments are computed at query time, never stored:

```sql
SELECT
  i.interstate,
  sdo_lrs.clip_geom_segment(
    i.geom,
    p.from_measure,
    p.to_measure
  ) geom
FROM
  us_interstates_lrs i,
  us_road_conditions p
WHERE
  i.interstate = p.interstate
  AND p.condition = 'poor';
```

### 4. Encapsulating Dynamic Segmentation in a View

Wrapping the clip in a view makes the dynamically segmented geometries queryable like a regular spatial table, including for tools that expect a base table/view with registered spatial metadata:

```sql
CREATE OR REPLACE VIEW us_interstates_lrs_condition AS
SELECT
  i.interstate,
  sdo_lrs.clip_geom_segment(
    i.geom,
    p.from_measure,
    p.to_measure
  ) geom,
  p.condition
FROM
  us_interstates_lrs i,
  us_road_conditions p
WHERE
  i.interstate = p.interstate;

-- The view needs its own USER_SDO_GEOM_METADATA row, copied from the base table.
INSERT INTO user_sdo_geom_metadata
  SELECT 'US_INTERSTATES_LRS_CONDITION', column_name, diminfo, srid
  FROM user_sdo_geom_metadata
  WHERE table_name = 'US_INTERSTATES_LRS';
COMMIT;
```

### 5. Locating Points Along a Route with Offset

`SDO_LRS.LOCATE_PT(geom, measure, offset)` turns a measure/offset pair into an actual point — e.g., placing a marker 50 km down I-25, and 200 m to either side of it:

```sql
-- The point located 50 km down I25
SELECT sdo_lrs.locate_pt(geom, 50000, 0)
FROM us_interstates_lrs
WHERE interstate = 'I25';

-- 200 m to the right (negative offset)
SELECT sdo_lrs.locate_pt(geom, 50000, -200)
FROM us_interstates_lrs
WHERE interstate = 'I25';

-- 200 m to the left (positive offset)
SELECT sdo_lrs.locate_pt(geom, 50000, 200)
FROM us_interstates_lrs
WHERE interstate = 'I25';
```

### 6. Projecting a Point and Finding Its Measure/Offset

Given an arbitrary point — e.g., a GPS fix for an accident report — `SDO_LRS.PROJECT_PT` snaps it onto the route, while `SDO_LRS.FIND_MEASURE` and `SDO_LRS.FIND_OFFSET` return just its measure and offset without constructing the projected point geometry:

```sql
-- Project point (-104.60663, 37.3906514) onto I25
SELECT sdo_lrs.project_pt(
  geom,
  SDO_GEOMETRY(
    2001,
    4326,
    SDO_POINT_TYPE(-104.60663, 37.3906514, NULL),
    NULL,
    NULL
  )
)
FROM
  us_interstates_lrs
WHERE
  interstate = 'I25';

-- Measure and offset of the same point on I25.
-- Positive offset = left side, negative offset = right side,
-- based on the orientation of the geometry (first point to last point).
SELECT
  sdo_lrs.find_measure(
    geom,
    SDO_GEOMETRY(
      2001,
      4326,
      SDO_POINT_TYPE(-104.60663, 37.3906514, NULL),
      NULL,
      NULL
    )
  ) accident_measure,
  sdo_lrs.find_offset(
    geom,
    SDO_GEOMETRY(
      2001,
      4326,
      SDO_POINT_TYPE(-104.60663, 37.3906514, NULL),
      NULL,
      NULL
    )
  ) accident_offset
FROM
  us_interstates_lrs
WHERE
  interstate = 'I25';
```

### 7. Reporting Length by Condition

Combine dynamic segmentation with `SDO_GEOM.SDO_LENGTH` to report total kilometers of road in each condition, per interstate — the condition segments are clipped and measured on the fly:

```sql
SELECT
  p.condition,
  i.interstate,
  SUM(
    sdo_geom.sdo_length(
      sdo_lrs.clip_geom_segment(
        i.geom,
        p.from_measure,
        p.to_measure),
      0.05,
      'unit=km')
  ) len
FROM
  us_interstates_lrs i,
  us_road_conditions p
WHERE
  i.interstate = p.interstate
GROUP BY
  p.condition,
  i.interstate
ORDER BY
  p.condition,
  i.interstate;
```

### 8. Intersecting Routes with Administrative Boundaries

`SDO_LRS.LRS_INTERSECTION` intersects a geometric segment with any other geometry (e.g., a county boundary) and — unlike `SDO_GEOM.SDO_INTERSECTION` — returns a result that **preserves LRS measure information**, so the intersection can still be queried with `SDO_LRS.GEOM_SEGMENT_*` functions:

```sql
-- The section of I25 that traverses El Paso county.
SELECT
  sdo_lrs.lrs_intersection(i.geom, c.geom, 0.5)
FROM
  us_interstates_lrs i,
  us_counties c
WHERE
  i.interstate = 'I25'
  AND c.county = 'El Paso'
  AND c.state_abrv = 'CO';

-- The measures where I25 crosses the El Paso county line.
SELECT
  sdo_lrs.geom_segment_length(geom) length,
  sdo_lrs.geom_segment_start_pt(geom) start_pt,
  sdo_lrs.geom_segment_end_pt(geom) end_pt,
  sdo_lrs.geom_segment_start_measure(geom) start_measure,
  sdo_lrs.geom_segment_end_measure(geom) end_measure
FROM (
  SELECT
    sdo_lrs.lrs_intersection(i.geom, c.geom, 0.5) geom
  FROM
    us_interstates_lrs i,
    us_counties c
  WHERE
    i.interstate = 'I25'
    AND c.county = 'El Paso'
    AND c.state_abrv = 'CO'
  );

-- I225 crosses several counties; where it does not cleanly split by
-- county the result can be a multiline string (e.g., Denver, Arapahoe).
SELECT
  c.county,
  sdo_lrs.lrs_intersection(i.geom, c.geom, 0.5)
FROM
  us_interstates_lrs i,
  us_counties c
WHERE
  i.interstate = 'I225'
  AND sdo_anyinteract(c.geom, i.geom) = 'TRUE';
```

### 9. Extracting and Rebuilding LRS Geometries from Vertices

`SDO_UTIL.GETVERTICES` unpacks a geometry into a row per vertex (with `x`, `y`, and `z` holding the measure for an LRS line). This is useful for exporting LRS data point-by-point, editing it externally, or reassembling it:

```sql
-- Flatten every LRS route's vertices, one row per point (m = measure, stored in z).
CREATE TABLE lrs_points AS
SELECT r.id AS road_id, p.id AS point_id, p.x, p.y, p.z AS m
FROM
  us_interstates_lrs r,
  TABLE(sdo_util.getvertices(r.geom)) p
ORDER BY r.id, p.id;
```

The points can be reassembled into an LRS line string per road using `CAST(MULTISET(...) AS SDO_ORDINATE_ARRAY)`. Two equivalent approaches — an explicit ordinate array subquery, or `UNPIVOT` to flatten `x`/`y`/`m` into a single ordered value stream:

```sql
CREATE TABLE lrs_lines AS
SELECT
  r.road_id,
  r.geom
FROM (
  SELECT
    c.road_id,
    SDO_GEOMETRY(
      3302,
      4326,
      NULL,
      SDO_ELEM_INFO_ARRAY(1,2,1),
      CAST(
        MULTISET(
          SELECT
            b.COLUMN_VALUE
          FROM
            lrs_points p,
            TABLE(SDO_ORDINATE_ARRAY(p.x, p.y, p.m)) b
          WHERE
            p.road_id = c.road_id
          ORDER BY
            p.point_id
        )
        AS SDO_ORDINATE_ARRAY
      )
    ) AS geom
  FROM
    lrs_points c
  GROUP BY
    c.road_id
) r;

-- Equivalent, using UNPIVOT instead of an explicit ordinate-array subquery.
CREATE TABLE lrs_lines_up AS
SELECT
  r.road_id,
  r.geom
FROM (
  SELECT
    c.road_id,
    SDO_GEOMETRY(
      3302,
      4326,
      NULL,
      SDO_ELEM_INFO_ARRAY(1,2,1),
      CAST(
        MULTISET(
          SELECT
            v
          FROM
            lrs_points
            UNPIVOT (v FOR (col) IN (x,y,m))
          WHERE
            road_id = c.road_id
          ORDER BY
            point_id
        )
        AS SDO_ORDINATE_ARRAY
      )
    ) AS geom
  FROM
    lrs_points c
  GROUP BY
    c.road_id
) r;
```

### 10. Reusable Utility: Midpoint of Any Geometry

A small PL/SQL function can combine `CONVERT_TO_LRS_GEOM`, `LOCATE_PT`, and `CONVERT_TO_STD_GEOM` to return the midpoint of **any** standard (non-LRS) line string, by temporarily treating it as an LRS segment with a measure range of `0` to `1` and locating the point at measure `0.5`:

```sql
CREATE OR REPLACE FUNCTION get_mid_point (
  geom SDO_GEOMETRY
) RETURN SDO_GEOMETRY
AS
BEGIN
  RETURN sdo_lrs.convert_to_std_geom(
    sdo_lrs.locate_pt(
      sdo_lrs.convert_to_lrs_geom(geom, 0, 1),
      0.5
    )
  );
END;
/
```

This pattern — convert to LRS with a normalized `0`–`1` measure range, locate a point at a fractional measure, convert back — is a convenient way to borrow LRS point-locating logic for geometries that otherwise have no measure dimension.

---

## SDO_LRS Function Quick Reference

| Function / Procedure | Purpose |
|---|---|
| `DEFINE_GEOM_SEGMENT` (`_3D`) | Defines a geometric segment; populates unassigned (`NULL`) shape-point measures |
| `REDEFINE_GEOM_SEGMENT` | Replaces existing measures with new, proportionally (re)calculated ones between a new start/end measure |
| `CLIP_GEOM_SEGMENT` (`_3D`) / `DYNAMIC_SEGMENT` | Extracts a sub-segment between two measures (dynamic segmentation); synonyms |
| `SPLIT_GEOM_SEGMENT` | Splits one geometric segment into two at a given measure |
| `CONCATENATE_GEOM_SEGMENTS` | Joins two geometric segments into one; result direction follows the first segment |
| `SDO_AGGR_LRS_CONCAT` | Spatial aggregate function; concatenates all connected segments in a column |
| `SCALE_GEOM_SEGMENT` | Linearly scales (translates/reverses/scales) a segment's measures |
| `TRANSLATE_MEASURE` | Shifts all measures of a segment by a constant |
| `REVERSE_GEOMETRY` | Reverses shape-point order / measure direction |
| `OFFSET_GEOM_SEGMENT` | Creates a new segment offset a perpendicular distance from the original |
| `LOCATE_PT` (`_3D`) | Returns the point at a given `(measure, offset)` along a segment |
| `PROJECT_PT` (`_3D`) | Returns the projection (and measure) of an arbitrary point onto a segment |
| `GET_MEASURE` | Returns the measure value of an LRS point |
| `CONVERT_TO_LRS_GEOM` | Converts a standard geometry to LRS format, adding the measure dimension |
| `CONVERT_TO_STD_GEOM` | Converts an LRS geometry back to standard (non-measure) format |
| `CONVERT_TO_LRS_LAYER` | Converts every geometry in a table column from standard to LRS format in one call |
| `LRS_INTERSECTION` | Intersects a geometric segment with another geometry, returning an LRS result that preserves measures |
| `FIND_MEASURE` (`_3D`) | Returns the measure of a point relative to a geometric segment, without returning the point geometry |
| `FIND_OFFSET` | Returns the offset of a point relative to a geometric segment (positive = left, negative = right, based on segment direction) |
| `CONNECTED_GEOM_SEGMENTS` | Tests, within a tolerance, whether two segments are spatially connected |
| `VALID_GEOM_SEGMENT` | Tests whether a geometry is a valid LRS geometric segment |
| `VALIDATE_LRS_GEOMETRY` (`_3D`) | Validates a geometric segment together with its measure information (needs `dim_array`); returns `TRUE` or raises `ORA-13331`/`ORA-13335` |
| `VALID_MEASURE` | Tests whether a measure value is valid (within range) for a segment |
| `VALID_LRS_PT` | Tests whether a geometry is a valid LRS point |
| `IS_GEOM_SEGMENT_DEFINED` | Tests whether a geometric segment has assigned measures |
| `GEOM_SEGMENT_LENGTH` | Returns the length (measure-range span) of a segment |
| `GEOM_SEGMENT_START_MEASURE` / `GEOM_SEGMENT_END_MEASURE` | Returns the start/end measure of a segment |
| `GEOM_SEGMENT_START_PT` / `GEOM_SEGMENT_END_PT` | Returns the start/end point of a segment |
| `MEASURE_TO_PERCENTAGE` | Returns the percentage (0–100) that a measure represents of a segment's measure range; reverse of `PERCENTAGE_TO_MEASURE` |
| `FIND_MEASURE` (`_3D`) | Returns the measure of a specified point (referenced as an example `_3D`-format function) |

Full parameter lists and additional subprograms are documented in the **SDO_LRS Package (Linear Referencing System)** reference, which is not included in this excerpt.

---

## Best Practices

- **Register the measure dimension** as the last `SDO_DIM_ELEMENT` in the `SDO_DIM_ARRAY` in `USER_SDO_GEOM_METADATA` before working with LRS geometries.
- **Define the segment** (`SDO_LRS.DEFINE_GEOM_SEGMENT`) before running other LRS operations — start, end, and any explicitly assigned measures must be present.
- **Do not index the measure dimension.** When indexing 4D LRS data, use a spatial R-tree index with `PARAMETERS('sdo_indx_dims=3')` to index only X, Y, Z — indexing M adds overhead with no benefit.
- **Match function format to geometry dimensionality**: use `_3D` functions only for 4D (X, Y, Z, M) line/multiline geometries when you need Z considered; standard functions on 4D data silently ignore Z.
- **Match dimensionality between paired arguments** — e.g., `PROJECT_PT` requires a 2D line + a 2D LRS point (`SDO_GTYPE = 3301`); `PROJECT_PT_3D` requires a 3D line + a 3D LRS point (`SDO_GTYPE = 3401`).
- **Choose tolerance carefully**: it applies only to non-measure dimensions (meters for geodetic data, native units otherwise). Too loose a tolerance can cause clip/offset operations to snap to unintended shape points.
- **Use `SDO_LRS.REDEFINE_GEOM_SEGMENT`** to rescale a segment's whole measure range (e.g., unit conversion) rather than manually editing individual ordinates.
- **Be aware of duplicate-measure behavior** for multiline strings and polygons with holes — LRS subprograms resolve ambiguity by using the first point with a given measure, unless doing so would produce an invalid geometry.

---

## Common Mistakes

### Mistake 1: Omitting the Measure Dimension from Metadata

```sql
-- WRONG: no M dimension registered — LRS operations on this column will fail or misbehave
INSERT INTO user_sdo_geom_metadata VALUES (
  'LRS_ROUTES',
  'ROUTE_GEOMETRY',
  SDO_DIM_ARRAY(
    SDO_DIM_ELEMENT('X', 0, 20, 0.005),
    SDO_DIM_ELEMENT('Y', 0, 20, 0.005)
  ),
  NULL
);

-- RIGHT: measure dimension included and last
INSERT INTO user_sdo_geom_metadata VALUES (
  'LRS_ROUTES',
  'ROUTE_GEOMETRY',
  SDO_DIM_ARRAY(
    SDO_DIM_ELEMENT('X', 0, 20, 0.005),
    SDO_DIM_ELEMENT('Y', 0, 20, 0.005),
    SDO_DIM_ELEMENT('M', 0, 20, 0.005)
  ),
  NULL
);
```

### Mistake 2: Storing LRS Point Data in SDO_POINT

LRS point data cannot be stored in the `SDO_POINT` attribute — it must be stored in `SDO_ELEM_INFO_ARRAY`/`SDO_ORDINATE_ARRAY`, as shown throughout the worked example (`SDO_GEOMETRY(3301, NULL, NULL, SDO_ELEM_INFO_ARRAY(1,1,1), SDO_ORDINATE_ARRAY(9,3,NULL))`).

### Mistake 3: Indexing the Measure Dimension

```sql
-- WRONG (or at least wasteful): indexing all four dimensions including M
PARAMETERS('sdo_indx_dims=4')

-- RIGHT: index only the non-measure dimensions
PARAMETERS('sdo_indx_dims=3')
```

### Mistake 4: Using the Standard Function Format on 4D Data

```sql
-- WRONG if you need Z considered: ignores the Z dimension on 4D (X,Y,Z,M) data
sdo_lrs.clip_geom_segment(a.geom, m.diminfo, 5, 10)

-- RIGHT: considers X, Y, and Z
sdo_lrs.clip_geom_segment_3d(a.geom, m.diminfo, 5, 10)
```

### Mistake 5: Mismatched GTYPE Between Line and Point Arguments

Passing a 2D LRS point (`SDO_GTYPE = 3301`) to a `_3D` function expecting a 3D LRS point (`SDO_GTYPE = 3401`), or vice versa, violates the dimensionality-matching requirement for LRS functions that take both a segment and a point.

---

## Oracle Version Notes: 19c vs. 26ai

Chapter 7, "Linear Referencing System," was compared directly between the [Oracle Database 19c Spatial and Graph Developer's Guide](https://docs.oracle.com/en/database/oracle/oracle-database/19/spatl/lrs-linear-referencing-system-concepts.html) (part E94799-23, July 2025) and the [Oracle Database 26ai Spatial Developer's Guide](https://docs.oracle.com/en/database/oracle/oracle-database/26/spatl/linear-referencing-system.html) (part G43344-02, April 30, 2026). The LRS API is **functionally unchanged** between the two releases:

- **Concepts and terminology** — identical section structure (7.1–7.7) and identical definitions for geometric segments, shape points, direction, measure, offset, measure populating, measure range, projection, LRS points, linear features, and the multiline/polygon-with-holes duplicate-measure behavior.
- **Data model** — identical guidance on adding the measure (`M`) dimension as the last `SDO_DIM_ELEMENT`, and identical `SDO_GTYPE` values (`3301` for 2D LRS points, `3302` for 2D LRS line strings, `3401` for 3D LRS points — including the same 3D-point GTYPE noted earlier in this document).
- **Indexing** — identical `sdo_indx_dims=3` guidance and R-tree requirement for 4D LRS data, and the same recommendation against indexing the measure dimension.
- **3D function formats** — the same `_3D` functions and the same dimensionality-matching rules between line/multiline and point arguments.
- **Worked example** — the same `Route1`/highway example (same coordinates, same measures, same function calls, same expected output values).
- **`SDO_LRS` package contents** — the [19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/spatl/SDO_LRS-reference.html) and [26ai](https://docs.oracle.com/en/database/oracle/oracle-database/26/spatl/sdo_lrs-package-linear-referencing-system.html) package reference pages list the **same 47 subprograms**. In particular, `SDO_LRS.LRS_INTERSECTION`, `SDO_LRS.CONVERT_TO_LRS_LAYER`, `SDO_LRS.CONVERT_TO_STD_GEOM`, and `SDO_LRS.FIND_OFFSET` (all used in the [Practical Example](#practical-example-road-network-with-dynamic-segmentation) section, sourced from the lab scripts) are **not** 26ai additions — they already existed in 19c.

**Practical takeaway:**

LRS code written against Oracle Database 19c is expected to run unchanged on 26ai. There is no LRS-specific migration concern based on this documentation comparison. The `SDO_LRS` package also documents several subprograms not covered in depth in this file (e.g., `GET_NEXT_SHAPE_PT`, `GET_PREV_SHAPE_PT`, `IS_MEASURE_INCREASING`/`DECREASING`, `PERCENTAGE_TO_MEASURE`, `RESET_MEASURE`, `REVERSE_MEASURE`, `SET_PT_MEASURE`, `CONVERT_TO_LRS_DIM_ARRAY`/`CONVERT_TO_STD_DIM_ARRAY`, `CONVERT_TO_STD_LAYER`, `FIND_LRS_DIM_POS`) — present identically in both versions' package reference.

## Sources

- [Oracle Database 19c — Spatial and Graph Developer's Guide, Linear Referencing System](https://docs.oracle.com/en/database/oracle/oracle-database/19/spatl/lrs-linear-referencing-system-concepts.html)
- [Oracle Database 26ai — Spatial Developer's Guide, Linear Referencing System](https://docs.oracle.com/en/database/oracle/oracle-database/26/spatl/linear-referencing-system.html)
