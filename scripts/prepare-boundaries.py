"""Convert NWIC downloads for this demo. Requires pyproj==3.8.0 shapely==2.1.2.

Usage: python scripts/prepare-boundaries.py /path/to/extracted-downloads
The directory must contain state_NWIC.GeoJSON and district_nwic.GeoJSON.
"""
import hashlib
import json
from pathlib import Path
import sys

import shapely
from shapely.geometry import shape, mapping
from shapely.ops import transform, unary_union
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'static'
transformer = Transformer.from_crs(7755, 4326, always_xy=True)
fix_names = {
    'Arunanchal Pradesh': 'Arunachal Pradesh',
    'Andaman & Nicobar Island': 'Andaman and Nicobar Islands',
    'Dadra & Nagar Havelli and Daman & Diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'Jammu & Kashmir': 'Jammu and Kashmir',
}

def write(name, value):
    (OUT / name).write_text(json.dumps(value, separators=(',', ':')) + '\n')

def feature(geometry, properties):
    # Retain full double precision after reprojection; no independent rounding
    # that might introduce self-intersections in tiny island rings.
    return {'type': 'Feature', 'properties': properties,
            'geometry': mapping(transform(transformer.transform, geometry))}

sources = []
for level, filename in [('state', 'state_NWIC.GeoJSON'), ('district', 'district_nwic.GeoJSON')]:
    raw = (Path(sys.argv[1]) / filename).read_bytes()
    data = json.loads(raw)
    assert data['crs']['properties']['name'] == 'urn:ogc:def:crs:EPSG::7755'
    originals = [shape(f['geometry']) for f in data['features']]
    repaired = [shapely.make_valid(g) for g in originals]
    assert shapely.coverage_is_valid(repaired), 'Source needs topology review'
    # Coverage simplification preserves shared boundaries and polygon components.
    # 100m is a Visvalingam area-based tolerance, not a positional-error bound.
    geometries = shapely.coverage_simplify(repaired, 100)
    assert shapely.coverage_is_valid(geometries)
    assert all(g.is_valid and not g.is_empty for g in geometries)
    assert all(shapely.get_num_geometries(before) == shapely.get_num_geometries(after)
               for before, after in zip(repaired, geometries)), 'An island component was lost'
    features = []
    for original, geometry in zip(data['features'], geometries):
        p = original['properties']
        properties = {'id': p['stcode'] if level == 'state' else f"{p['stcode']}-{p['objectid']}",
                      'name': fix_names.get(p['state_name'], p['state_name']) if level == 'state' else p['district'],
                      'source_name': p['state_name'] if level == 'state' else p['district'],
                      'state_id': p['stcode'], 'source_agency': p['src_agency']}
        if level == 'district':
            properties['district_code'] = p['dtcode']
        features.append(feature(geometry, properties))
    assert len({f['properties']['id'] for f in features}) == len(features)
    if level == 'district':
        (OUT / 'districts').mkdir(exist_ok=True)
        for state_id in sorted({f['properties']['state_id'] for f in features}):
            write(f'districts/{state_id}.geojson', {'type': 'FeatureCollection', 'features': [
                f for f in features if f['properties']['state_id'] == state_id]})
    else:
        write(f'india-{level}s.geojson', {'type': 'FeatureCollection', 'features': features})
    sources.append({'level': level, 'input_sha256': hashlib.sha256(raw).hexdigest(),
                    'features': len(features), 'repaired_features': sum(not g.is_valid for g in originals),
                    'input_vertices': sum(int(shapely.get_num_coordinates(g)) for g in originals),
                    'output_vertices': sum(int(shapely.get_num_coordinates(g)) for g in geometries)})
    if level == 'state':
        country = unary_union(geometries)
        assert country.is_valid
        write('india-country.geojson', {'type': 'FeatureCollection', 'features': [feature(country, {'id': 'IN', 'name': 'India'})]})
write('boundary-build.json', {'source_crs': 'EPSG:7755', 'output_crs': 'EPSG:4326',
                              'simplification_tolerance_metres': 100, 'sources': sources})
print(json.dumps(sources, indent=2))
