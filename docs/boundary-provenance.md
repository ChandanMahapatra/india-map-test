# Boundary provenance and representation

The demo uses India's representation from government-published administrative data.
It has no UN, OSM, CARTO or other world political boundary layer underneath it.
The country outline is a dissolve of the supplied state/UT polygons, including
the northern extent in Ladakh and Arunachal Pradesh. No disputed-line overlay is
added. This describes the chosen cartographic representation, not independent
certification of the app or every coordinate.

## Sources

- [State Boundary — National Water Data Portal](https://nwdp.nwic.gov.in/dataset/state-boundary): 36 features, including separate Jammu and Kashmir and Ladakh and the merged Dadra and Nagar Haveli and Daman and Diu.
- [District Boundary — National Water Data Portal](https://nwdp.nwic.gov.in/dataset/district-boundary): 733 features; portal metadata dated 5 May 2025. Do not present this as the current nationwide district count.
- [NWIC copyright policy](https://www.nwdp.nwic.gov.in/hi/footer/copyrightPolicy): permits reproduction with accurate use and prominent attribution, except separately identified third-party copyrighted materials.
- [Survey of India political map reference](https://surveyofindia.gov.in/pages/political-map-of-india): reference for future boundary review.

Both archives were retrieved on 4 October 2026. The actual GeoJSON feature field
`src_agency` identifies `Survey of India (SOI)`. Some portal organization metadata
inconsistently refers to Geological Survey of India; the app credits the producer
as recorded in the files and NWIC as publisher. The retrieval date does not imply
the boundaries were surveyed or updated on that date.

## Reproduce the conversion

Download and extract these source archives outside the repository:

- [State GeoJSON ZIP](https://nwdp.nwic.gov.in/dataset/dd960900-34cc-4486-a95c-83200d2f2c7b/resource/f039e721-132c-4a24-9e5e-07af03064b4d/download/state_nwic_geojson.zip)
- [District GeoJSON ZIP](https://nwdp.nwic.gov.in/dataset/6c1af675-1dec-4927-882c-c1ba9d73f76b/resource/8d9aa2e9-9806-4f26-a4ac-48ba21e9b96d/download/district_nwic_geojson.zip)

Install `pyproj==3.8.0` and `shapely==2.1.2` in an isolated Python environment,
then run `python scripts/prepare-boundaries.py /path/to/extracted-downloads`.
The script records source SHA-256 hashes and counts in `static/boundary-build.json`.
Districts are partitioned into `static/districts/{stateId}.geojson` so selecting
a state downloads only its districts rather than the entire nationwide dataset.
Run `python scripts/verify-boundaries.py` for independent geometry, identifier,
parent, country/state union, extent and representation regression checks.

The input CRS is EPSG:7755, **not longitude/latitude**. The script repairs invalid
rings, verifies polygon coverage, simplifies shared edges together in the metric
source CRS with Shapely's 100m area-based coverage tolerance, then reprojects to
EPSG:4326 in longitude/latitude order. The tolerance is not a guaranteed maximum
positional error. Polygon components and islands are retained. Country geometry
is dissolved from the same simplified states. State and district coverages are
generalized independently, so their edges are not guaranteed to coincide exactly.
Use authoritative unsimplified data for measurement or survey work.

The checked conversion retains all 390 state polygon components and all 1,220
district components after ring repair. Largest observed relative area change
from simplification is approximately 0.076% for a state/UT and 0.161% for a
district. These checks characterize this snapshot, not future downloads.

Only display spelling is normalized for Arunachal Pradesh, Andaman and Nicobar
Islands, Jammu and Kashmir, and Dadra and Nagar Haveli and Daman and Diu.
Original source names remain in `source_name`. State IDs use `stcode`; district
IDs combine `stcode` and source `objectid` because the district code `999` occurs
twice. These district IDs identify this snapshot and are not promised to remain
stable across replacement datasets.

## Update policy

Replace the data and manifest together. Check coordinate system, identifiers,
parent relationships, feature counts, geometry validity, northern and eastern
extent, island coverage, source terms, and administrative vintage before release.
Keep provenance with exported AOIs. Do not silently add a world basemap: review
its boundary and label layers against the selected India representation first.
