import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { boundsOf, normalizeCollection } from './aoi.js';
const root = new URL('../../static/', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const manifest = read('boundary-manifest.json');
test('India snapshot has 36 states/UTs and 733 districts with unique IDs and valid parents', () => {
	assert.equal(manifest.representation, 'India');
	const source = (id) => manifest.sources.find((item) => item.id === id);
	const states = normalizeCollection(read('india-states.geojson'), source('state'));
	assert.equal(states.features.length, 36);
	assert.ok(states.features.some((f) => f.properties.aoi_name === 'Ladakh'));
	assert.ok(
		states.features.some(
			(f) => f.properties.aoi_name === 'Dadra and Nagar Haveli and Daman and Diu'
		)
	);
	const ids = new Set();
	let count = 0;
	for (const state of states.features) {
		const districts = normalizeCollection(
			read(source('district').url.replace('{stateId}', state.id)),
			source('district')
		);
		for (const feature of districts.features) {
			assert.equal(feature.properties.state_id, state.id);
			assert.ok(!ids.has(feature.id));
			ids.add(feature.id);
			count++;
		}
	}
	assert.equal(count, 733);
	assert.equal(
		readdirSync(new URL('districts/', root)).filter((name) => name.endsWith('.geojson')).length,
		36
	);
});
test('country/state extents retain northern, eastern and island coverage', () => {
	const country = read('india-country.geojson');
	const states = read('india-states.geojson');
	assert.deepEqual(boundsOf(country), boundsOf(states));
	const [west, south, east, north] = boundsOf(country);
	assert.ok(west > 68 && west < 69 && south > 6 && south < 7);
	assert.ok(east > 97 && east < 98 && north > 37 && north < 38);
	for (const name of ['Lakshadweep', 'Andaman and Nicobar Islands'])
		assert.equal(
			states.features.find((f) => f.properties.name === name).geometry.type,
			'MultiPolygon'
		);
});
