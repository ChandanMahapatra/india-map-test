import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	boundsOf,
	normalizeCollection,
	selectFeatures,
	extentFeature,
	exportSelection
} from './aoi.js';
const polygon = (id, name, coordinates) => ({
	type: 'Feature',
	properties: { code: id, name },
	geometry: { type: 'Polygon', coordinates }
});
const source = { id: 'state', label: 'States', idProperty: 'code', nameProperty: 'name' };
const collection = {
	type: 'FeatureCollection',
	features: [
		polygon('1', 'A', [
			[
				[70, 10],
				[72, 10],
				[72, 12],
				[70, 10]
			],
			[
				[70.5, 10.5],
				[71, 10.5],
				[71, 11],
				[70.5, 10.5]
			]
		]),
		{
			type: 'Feature',
			properties: { code: '2', name: 'Island' },
			geometry: {
				type: 'MultiPolygon',
				coordinates: [
					[
						[
							[90, 5],
							[91, 5],
							[91, 6],
							[90, 5]
						]
					],
					[
						[
							[92, 7],
							[93, 7],
							[93, 8],
							[92, 7]
						]
					]
				]
			}
		}
	]
};
test('full geometry bounds include holes, every island, and off-screen features', () => {
	assert.deepEqual(boundsOf(collection), [70, 5, 93, 12]);
	assert.deepEqual(boundsOf(collection.features[1]), [90, 5, 93, 8]);
});
test('adapter creates stable IDs and preserves properties and geometry', () => {
	const normalized = normalizeCollection(collection, source);
	assert.equal(normalized.features[0].id, '1');
	assert.equal(normalized.features[0].properties.aoi_name, 'A');
	assert.equal(normalized.features[0].geometry, collection.features[0].geometry);
	assert.throws(
		() =>
			normalizeCollection(
				{ ...collection, features: [collection.features[0], collection.features[0]] },
				source
			),
		/unique/
	);
});
test('selection is id-based and export includes geometry and provenance', () => {
	const normalized = normalizeCollection(collection, source);
	const selected = selectFeatures(normalized, ['2']);
	const exported = exportSelection(selected, {
		level: 'state',
		representation: 'India',
		source: { provenance: { name: 'Test source' } }
	});
	assert.equal(exported.features.length, 1);
	assert.deepEqual(exported.aoi.bbox, [90, 5, 93, 8]);
	assert.equal(exported.aoi.source.name, 'Test source');
	assert.throws(() => exportSelection({ type: 'FeatureCollection', features: [] }, {}), /Select/);
});
test('extent is closed, ordered, and rejects invalid geographic input', () => {
	assert.deepEqual(boundsOf(extentFeature([70, 10, 80, 20])), [70, 10, 80, 20]);
	const ring = extentFeature([70, 10, 80, 20]).geometry.coordinates[0];
	assert.deepEqual(ring[0], ring.at(-1));
	for (const bounds of [
		[80, 10, 70, 20],
		[70, 20, 80, 10],
		[70, 10, 181, 20],
		[70, NaN, 80, 20]
	])
		assert.throws(() => extentFeature(bounds));
});
test('invalid and empty coordinates fail before map initialization', () => {
	assert.throws(() => boundsOf({ type: 'Polygon', coordinates: [] }), /empty/);
	assert.throws(() => boundsOf({ type: 'Point', coordinates: [181, 0] }), /WGS84/);
});

test('adapter rejects unclosed or undersized polygon rings', () => {
	for (const coordinates of [
		[
			[
				[70, 10],
				[71, 10],
				[71, 11]
			]
		],
		[
			[
				[70, 10],
				[71, 10],
				[71, 11],
				[70, 11]
			]
		]
	])
		assert.throws(
			() =>
				normalizeCollection(
					{ type: 'FeatureCollection', features: [polygon('1', 'Broken', coordinates)] },
					source
				),
			/closed/
		);
});
