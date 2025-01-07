<script>
	import maplibregl from 'maplibre-gl';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	export let selectedState = writable('');

	let map;
	let mapContainer;
	const originalCenter = [81.9629, 22.5937]; // Center of India
	const originalZoom = 3.6;
	const geojsonUrl =
		import.meta.env.MODE === 'development'
			? '/india-states.geojson'
			: 'https://github.com/ChandanMahapatra/india-map-test/blob/gh-pages/india-states.geojson';

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
