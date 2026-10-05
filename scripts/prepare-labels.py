"""Build interior state label anchors from the shipped India geometry."""
import json
from pathlib import Path
from shapely.geometry import shape

root = Path(__file__).resolve().parents[1]
states = json.loads((root / 'static/india-states.geojson').read_text())
features = []
for feature in states['features']:
    geometry = shape(feature['geometry'])
    polygon = max(geometry.geoms, key=lambda part: part.area) if geometry.geom_type == 'MultiPolygon' else geometry
    point = polygon.representative_point()
    features.append({'type': 'Feature', 'properties': {'name': feature['properties']['name'], 'kind': 'state', 'state_id': feature['properties']['id']}, 'geometry': {'type': 'Point', 'coordinates': [point.x, point.y]}})
# Approximate cartographic label anchors, not boundary or territorial datasets.
context = [
    ('India', 79, 23, 'india'),
    ('Pakistan', 66, 29, 'country'), ('Afghanistan', 65, 34, 'country'),
    ('China', 91, 35, 'country'), ('Nepal', 84, 28.4, 'country'),
    ('Bhutan', 90.4, 27.5, 'country'), ('Bangladesh', 90.2, 23.8, 'country'),
    ('Myanmar', 96, 21, 'country'), ('Sri Lanka', 80.7, 7.5, 'country'),
    ('Arabian Sea', 67, 16, 'water'), ('Bay of Bengal', 89, 15, 'water'),
    ('Indian Ocean', 80, 3, 'water')
]
for name, longitude, latitude, kind in context:
    features.append({'type': 'Feature', 'properties': {'name': name, 'kind': kind}, 'geometry': {'type': 'Point', 'coordinates': [longitude, latitude]}})
(root / 'static/map-labels.geojson').write_text(json.dumps({'type': 'FeatureCollection', 'features': features}, separators=(',', ':')) + '\n')
print(f'Generated {len(features)} state, country and water labels')
