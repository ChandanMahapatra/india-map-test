/** Pure geometry and selection primitives; independent of React and MapLibre. */
export function boundsOf(input) {
	const bounds = [Infinity, Infinity, -Infinity, -Infinity];
	function visit(coordinates) {
		if (!Array.isArray(coordinates)) throw new Error('Invalid GeoJSON coordinates.');
		if (typeof coordinates[0] === 'number') {
			const [lng, lat] = coordinates;
			if (
				!Number.isFinite(lng) ||
				!Number.isFinite(lat) ||
				lng < -180 ||
				lng > 180 ||
				lat < -90 ||
				lat > 90
			)
				throw new Error('Coordinates must be WGS84 longitude and latitude.');
			bounds[0] = Math.min(bounds[0], lng);
			bounds[1] = Math.min(bounds[1], lat);
			bounds[2] = Math.max(bounds[2], lng);
			bounds[3] = Math.max(bounds[3], lat);
		} else coordinates.forEach(visit);
	}
	function geometry(value) {
		if (!value) throw new Error('Missing geometry.');
		if (value.type === 'FeatureCollection') value.features.forEach(geometry);
		else if (value.type === 'Feature') geometry(value.geometry);
		else if (value.type === 'GeometryCollection') value.geometries.forEach(geometry);
		else visit(value.coordinates);
	}
	geometry(input);
	if (!bounds.every(Number.isFinite)) throw new Error('Geometry is empty.');
	return bounds;
}

export function normalizeCollection(data, source) {
	if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features) || !data.features.length)
		throw new Error(`${source.label}: expected a nonempty FeatureCollection.`);
	const seen = new Set();
	const features = data.features.map((feature) => {
		if (!['Polygon', 'MultiPolygon'].includes(feature.geometry?.type))
			throw new Error(`${source.label}: only Polygon and MultiPolygon areas are supported.`);
		const polygons =
			feature.geometry.type === 'Polygon'
				? [feature.geometry.coordinates]
				: feature.geometry.coordinates;
		if (!Array.isArray(polygons) || !polygons.length)
			throw new Error(`${source.label}: polygon geometry is empty.`);
		for (const polygon of polygons) {
			if (!Array.isArray(polygon) || !polygon.length)
				throw new Error(`${source.label}: polygon must contain an exterior ring.`);
			for (const ring of polygon) {
				if (
					!Array.isArray(ring) ||
					ring.length < 4 ||
					ring.some(
						(position) =>
							!Array.isArray(position) || position.length < 2 || !position.every(Number.isFinite)
					) ||
					ring[0].length !== ring.at(-1).length ||
					ring[0].some((value, index) => value !== ring.at(-1)[index])
				)
					throw new Error(
						`${source.label}: polygon rings require at least four positions and must be closed.`
					);
			}
		}
		boundsOf(feature);
		const id = String(feature.properties?.[source.idProperty] ?? feature.id ?? '');
		const name = String(feature.properties?.[source.nameProperty] ?? '');
		if (!id || !name || seen.has(id))
			throw new Error(`${source.label}: feature IDs and names must be present, with unique IDs.`);
		seen.add(id);
		return {
			...feature,
			id,
			properties: { ...feature.properties, aoi_id: id, aoi_name: name, aoi_level: source.id }
		};
	});
	return { type: 'FeatureCollection', features };
}

export function selectFeatures(collection, ids) {
	const selected = new Set(ids);
	return {
		type: 'FeatureCollection',
		features: collection.features.filter((feature) => selected.has(String(feature.id)))
	};
}

export function extentFeature(bounds) {
	const [west, south, east, north] = bounds;
	if (
		![west, south, east, north].every(Number.isFinite) ||
		west >= east ||
		south >= north ||
		west < -180 ||
		east > 180 ||
		south < -90 ||
		north > 90
	)
		throw new Error('Enter a valid extent: west < east and south < north, in WGS84.');
	return {
		type: 'Feature',
		id: 'extent',
		properties: { aoi_id: 'extent', aoi_name: 'Custom extent', aoi_level: 'extent' },
		geometry: {
			type: 'Polygon',
			coordinates: [
				[
					[west, south],
					[east, south],
					[east, north],
					[west, north],
					[west, south]
				]
			]
		}
	};
}

export function exportSelection(collection, { level, representation, source }) {
	if (!collection.features.length) throw new Error('Select an area before exporting.');
	return {
		...collection,
		aoi: {
			level,
			representation,
			crs: 'OGC:CRS84',
			bbox: boundsOf(collection),
			featureCount: collection.features.length,
			source: source?.provenance ?? null
		}
	};
}

export const EMPTY_COLLECTION = { type: 'FeatureCollection', features: [] };
