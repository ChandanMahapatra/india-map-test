export const formatAccidents = (value) =>
	value == null ? 'Not available' : new Intl.NumberFormat('en-IN').format(value);

/** Never allocate state totals to district polygons or arbitrary extents. */
export function accidentSummary(data, stateIds, year, national = false) {
	if (!data) return null;
	const records = data.records.filter((record) => stateIds.includes(record.stateId));
	const valueFor = (y) =>
		national
			? data.totals[y]
			: records.length && records.every((r) => r.values[y] != null)
				? records.reduce((sum, r) => sum + r.values[y], 0)
				: null;
	const total = valueFor(year);
	const previous = valueFor(year - 1);
	const change =
		total != null && previous != null && previous > 0
			? ((total - previous) / previous) * 100
			: null;
	const ranked = [...data.records]
		.filter((r) => r.values[year] != null)
		.sort((a, b) => b.values[year] - a.values[year]);
	return {
		total,
		change,
		share: total != null && !national ? (total / data.totals[year]) * 100 : null,
		rank:
			!national && records.length === 1 && total != null
				? ranked.findIndex((r) => r.stateId === records[0].stateId) + 1
				: null,
		trend: data.years.map((y) => ({ year: y, value: valueFor(y) })),
		note:
			!national && stateIds.includes('01') && year <= 2020
				? 'Jammu and Kashmir includes Ladakh in this year.'
				: !national && stateIds.includes('37') && year <= 2020
					? 'Separate Ladakh figures are unavailable before 2021.'
					: ''
	};
}

export function accidentMapCollection(states, data, year) {
	if (!states || !data) return { type: 'FeatureCollection', features: [] };
	const values = new Map(data.records.map((record) => [record.stateId, record.values[year]]));
	return {
		...states,
		features: states.features.map((feature) => ({
			...feature,
			properties: { ...feature.properties, accidents: values.get(feature.id) ?? null }
		}))
	};
}

export const ACCIDENT_COLORS = ['#edf6f2', '#d3e9df', '#a8d0c0', '#6faf97', '#368465', '#145338'];
export const ACCIDENT_STOPS = [500, 5000, 15000, 30000, 50000];
