<script>
	import maplibregl from 'maplibre-gl';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	export let selectedState = writable('');

	let map;
	let mapContainer;
	const originalCenter = [81.9629, 22.5937]; // Center of India
	const originalZoom = 3.6;
	const geojsonUrl = '/india-states.geojson'; // Path to your GeoJSON file

	onMount(() => {
		map = new maplibregl.Map({
			container: mapContainer,
			style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
			center: originalCenter,
			zoom: originalZoom
		});

		map.on('load', () => {
			map.addSource('india-states', { type: 'geojson', data: geojsonUrl });
			map.addLayer({
				id: 'state-boundaries',
				type: 'line',
				source: 'india-states',
				paint: { 'line-color': '#000', 'line-width': 2 }
			});
			map.addLayer({
				id: 'state-highlight',
				type: 'fill',
				source: 'india-states',
				paint: { 'fill-color': '#FF0000', 'fill-opacity': 0.5 },
				filter: ['==', 'st_nm', '']
			});
			selectedState.subscribe((stateName) => {
				map.setFilter('state-highlight', ['==', 'st_nm', stateName]);
				const features = map.querySourceFeatures('india-states', {
					filter: ['==', 'st_nm', stateName]
				});
				if (features.length > 0) {
					const bbox = features[0].geometry.coordinates.reduce(
						(bounds, coord) => coord.reduce((b, [lng, lat]) => b.extend([lng, lat]), bounds),
						new maplibregl.LngLatBounds()
					);
					map.fitBounds(bbox, { padding: 20 });
				}
			});
		});

		return () => map.remove();
	});

	function resetMap() {
		map.flyTo({ center: originalCenter, zoom: originalZoom });
	}
</script>

<div bind:this={mapContainer} class="w-full h-full"></div>
