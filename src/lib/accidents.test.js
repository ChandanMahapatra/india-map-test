import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { accidentSummary, accidentMapCollection } from './accidents.js';
const data = JSON.parse(
	readFileSync(new URL('../../static/accidents.json', import.meta.url), 'utf8')
);
test('corrected state totals reconcile to all five government national totals', () => {
	assert.equal(data.records.length, 36);
	assert.equal(new Set(data.records.map((r) => r.stateId)).size, 36);
	for (const year of data.years)
		assert.equal(
			data.records.reduce((n, r) => n + (r.values[year] ?? 0), 0),
			data.totals[year]
		);
	assert.equal(data.records.find((r) => r.stateId === '02').values[2022], 2597);
	assert.deepEqual(data.records.find((r) => r.stateId === '38').values, {
		2018: 156,
		2019: 137,
		2020: 100,
		2021: 140,
		2022: 196
	});
});
test('national and multiple-state summaries follow selected year without double counting', () => {
	assert.equal(accidentSummary(data, [], 2022, true).total, 461312);
	const karnataka = accidentSummary(data, ['29'], 2022);
	assert.equal(karnataka.total, 39762);
	assert.equal(karnataka.rank, 5);
	assert.ok(Math.abs(karnataka.change - 14.763) < 0.01);
	assert.equal(accidentSummary(data, ['29', '32'], 2022).total, 83672);
	assert.equal(accidentSummary(data, ['29', '29'], 2022).total, 39762);
});
test('unavailable Ladakh years are gaps, not zero; historical J&K scope is disclosed', () => {
	const ladakh = accidentSummary(data, ['37'], 2020);
	assert.equal(ladakh.total, null);
	assert.equal(ladakh.change, null);
	assert.equal(ladakh.trend[0].value, null);
	assert.match(ladakh.note, /unavailable/);
	assert.match(accidentSummary(data, ['01'], 2020).note, /includes Ladakh/);
	assert.equal(accidentSummary(data, ['01', '37'], 2020).total, null);
	const states = {
		type: 'FeatureCollection',
		features: [{ id: '37', properties: { name: 'Ladakh' } }]
	};
	assert.equal(accidentMapCollection(states, data, 2020).features[0].properties.accidents, null);
});
