<script lang="ts">
	import maplibregl from 'maplibre-gl';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import Papa from 'papaparse';

	export let selectedState = writable('');

	interface stateAccident 
	{ 
		id: int; 
		state_name: string; 
		total_accidents_2018: int;
		total_accidents_2019: int;
		total_accidents_2020: int;
		total_accidents_2021: int;
		total_accidents_2022: int;
		abs_change_in_2022: int;
		rel_change_in_2022: int;
		rank_2018: int;
		rank_2019: int;
		rank_2020: int;
		rank_2021: int;
		rank_2022: int;
	};

	function transformRow(row: any) : stateAccident
	{
		return {
			id: row.Sr_No,
			state_name: row.State_Name,
			total_accidents_2018: row._2018,
			total_accidents_2019: row._2019,
			total_accidents_2020: row._2020,
			total_accidents_2021: row._2021,
			total_accidents_2022: row._2022,
			abs_change_in_2022: row.Absolute_Change_in_2022_over_2021,
			rel_change_in_2022: row.percent_change_in_2022_over_2021,
			rank_2018: row.rank_2018,
			rank_2019: row.rank_2019,
			rank_2020: row.rank_2020,
			rank_2021: row.rank_2021,
			rank_2022: row.rank_2022
		};
	}

	let map;
	let mapContainer;
	const originalCenter = [81.9629, 22.5937]; // Center of India
	const originalZoom = 3.6;
	const geojsonUrl =
		import.meta.env.MODE === 'development'
			? '/india-states.geojson'
			: 'https://raw.githubusercontent.com/ChandanMahapatra/india-map-test/gh-pages/india-states.geojson';

	const allStateAccidentsDataUrl = 
			import.meta.env.MODE === 'development'
			? '/total_accidents.csv'
			: 'https://raw.githubusercontent.com/ChandanMahapatra/india-map-test/gh-pages/india-states.geojson';

	onMount(() => {
		map = new maplibregl.Map({
			container: mapContainer,
			style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
			center: originalCenter,
			zoom: originalZoom
		});

		map.on('load', () => {
			// Add the GeoJSON source for states
			map.addSource('india-states', {
				type: 'geojson',
				data: geojsonUrl
			});

			// Add a layer for state boundaries
			map.addLayer({
				id: 'state-boundaries',
				type: 'line',
				source: 'india-states',
				paint: {
					'line-color': '#000',
					'line-width': 2
				}
			});

			// Add a layer for highlighting the selected state
			map.addLayer({
				id: 'state-highlight',
				type: 'fill',
				source: 'india-states',
				paint: {
					'fill-color': '#FF0000',
					'fill-opacity': 0.5
				},
				filter: ['==', 'st_nm', ''] // No state highlighted by default
			});

			let stateAccidents: stateAccident[]; 
			Papa.parse<stateAccident>(allStateAccidentsDataUrl, {
				download: true,
				header: true,
				dynamicTyping: true,
				complete: function(results) { 
					stateAccidents = results.data.map(transformRow);
					console.log('Parsed Data:', stateAccidents); 
					//console.log(stateAccidents[0].total_accidents_2018);
				}
			});

			// Listen to changes in the selected state
			selectedState.subscribe((stateName) => {
				if (stateName) {
					map.setFilter('state-highlight', ['==', 'st_nm', stateName]);

					// Zoom to the selected state
					const features = map.querySourceFeatures('india-states', {
						filter: ['==', 'st_nm', stateName]
					});

					if (features.length > 0) {
						const bbox = features[0].geometry.coordinates.reduce(
							(bounds, coord) =>
								coord.reduce((innerBounds, [lng, lat]) => innerBounds.extend([lng, lat]), bounds),
							new maplibregl.LngLatBounds()
						);

						map.fitBounds(bbox, { padding: 40 });
					} else {
						console.error('No matching features found for state:', stateName);
					}
				} else {
					// Clear the highlight if no state is selected
					map.setFilter('state-highlight', ['==', 'st_nm', '']);
				}
			});
		});

		return () => map.remove();
	});

	// Public function to reset the map
	export function resetMap() {
		map.flyTo({ center: originalCenter, zoom: originalZoom });
		map.setFilter('state-highlight', ['==', 'st_nm', '']);
		selectedState.set('');
	}
</script>

<div class="relative w-full h-full">
	<div bind:this={mapContainer} class="w-full h-full"></div>
</div>
