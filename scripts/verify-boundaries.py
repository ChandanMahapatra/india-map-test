"""Independent geometry checks; run after prepare-boundaries.py (requires Shapely)."""
import json
from pathlib import Path

from shapely.geometry import shape, Point
from shapely.ops import unary_union

root = Path(__file__).resolve().parents[1] / 'static'
collections = {name: json.loads((root / f'india-{name}.geojson').read_text())
               for name in ['country', 'states']}
collections['districts'] = {'type': 'FeatureCollection', 'features': [
    feature for path in sorted((root / 'districts').glob('*.geojson'))
    for feature in json.loads(path.read_text())['features']]}
for name, count in [('country', 1), ('states', 36), ('districts', 733)]:
    features = collections[name]['features']
    assert len(features) == count, (name, 'unexpected snapshot count')
    assert len({f['properties']['id'] for f in features}) == count
    for f in features:
        geometry = shape(f['geometry'])
        assert geometry.is_valid and not geometry.is_empty, (name, f['properties']['id'])
        assert geometry.geom_type in ['Polygon', 'MultiPolygon']
    print(f'{name}: {count} valid nonempty geometries and unique IDs')
state_ids = {f['properties']['id'] for f in collections['states']['features']}
assert all(f['properties']['state_id'] in state_ids for f in collections['districts']['features'])
country = shape(collections['country']['features'][0]['geometry'])
assert country.equals(unary_union([shape(f['geometry']) for f in collections['states']['features']]))
# Regression probes for the chosen representation, not exhaustive certification.
for name, coordinates in [('Gilgit region', (74.3, 35.9)), ('Aksai Chin', (79, 35)),
                          ('Arunachal Pradesh', (94.7, 28.2)), ('Lakshadweep', (72.63, 10.57))]:
    assert country.covers(Point(coordinates)), name
west, south, east, north = country.bounds
assert 68 < west < 69 and 6 < south < 7 and 97 < east < 98 and 37 < north < 38
print('Parent IDs, country/state union, representation probes and island extent passed.')
