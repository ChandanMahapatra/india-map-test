<script>
	import maplibregl from 'maplibre-gl';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	export let selectedState = writable('');

	let map;
	let mapContainer;

	const geojsonUrl = '/states_india.geojson'; // Path to your GeoJSON

	onMount(() => {
		map = new maplibregl.Map({
			container: mapContainer,
			style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
			center: [78.9629, 22.5937], // Center of India
			zoom: 4
		});

		map.on('load', () => {
			// Add GeoJSON source
			map.addSource('india-states', {
				type: 'geojson',
				data: geojsonUrl
			});

			// Add state boundaries layer
			map.addLayer({
				id: 'state-boundaries',
				type: 'line',
				source: 'india-states',
				paint: {
					'line-color': '#000',
					'line-width': 2
				}
			});

			// Add highlight layer
			map.addLayer({
				id: 'state-highlight',
				type: 'fill',
				source: 'india-states',
				paint: {
					'fill-color': '#FF0000',
					'fill-opacity': 0.5
				},
				filter: ['==', 'NAME_1', ''] // Default no highlight
			});

			// Update highlight when selectedState changes
			selectedState.subscribe((stateName) => {
				map.setFilter('state-highlight', ['==', 'NAME_1', stateName]);
			});
		});

		return () => map.remove();
	});
</script>

<div bind:this={mapContainer} style="width: 100%; height: 500px;"></div>
