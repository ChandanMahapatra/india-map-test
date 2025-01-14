<script lang="ts">
	import maplibregl from 'maplibre-gl';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	
	//let stateAccidents;
	export let selectedState = writable('');
	export let stateAccidents;
	let map;
	let mapContainer;
	const originalCenter = [81.9629, 22.5937]; // Center of India
	const originalZoom = 3.6;
	const geojsonUrl =
		import.meta.env.MODE === 'development'
			? '/geoBoundaries-IND-ADM1_simplified.geojson'
			: 'https://raw.githubusercontent.com/ChandanMahapatra/india-map-test/gh-pages/india-states.geojson';

	onMount(() => {
		map = new maplibregl.Map({
			container: mapContainer,
			style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
			center: originalCenter,
			zoom: originalZoom
		});

		map.on('load', () => {

			fetch(geojsonUrl)
			.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			return response.json();
			})
			.then(geojsonData => {
				// Merge the data into GeoJSON properties
				geojsonData.features.forEach(feature => {
					//too bad O(n^2), fix later
      				feature.properties.accidentsStat = stateAccidents.find((element) => element.state_name == feature.properties.shapeName) || 0; // Default to 0 if no data
					
					//I am not able to query property from nested object, hence add data directly properties object in json
					feature.properties.accidents = feature.properties.accidentsStat.total_accidents_2022;
				});
				console.log(geojsonData);

				// Add the GeoJSON source for states
				map.addSource('india-states', {
					type: 'geojson',
					data: geojsonData
				});

				// Add a layer for state boundaries
				map.addLayer({
					id: 'state-boundaries',
					type: 'line',
					source: 'india-states',
					paint: {
						'line-color': '#6a6a6a',
						'line-width': 0.25
					}
				});

				map.on('sourcedata', (e) => {
					if(e.sourceId === 'india-states' && e.isSourceLoaded)
					{
						// Add a fill layer for the choropleth polygons
						map.addLayer({
							'id': 'accident-layer',
							'type': 'fill',
							'source': 'india-states',
							'paint': {
							// Style polygons based on the value
							'fill-color': [
								'case',
								// Check if 'accidentsStat.total_accidents_2022' is not null or undefined
								['!=', ['get', 'accidents'], null], 
								['interpolate',
								['linear'],
								['get', 'accidents'],
								0, '#e3ebff', // lowest values
								25000, '#044afb', // middle values
								50000, '#011954' // highest values
								],
								'#fff000',  // Default color for null population
							],
							'fill-opacity': 0.7
							}
						});
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
					filter: ['==', ['get', 'shapeName'], ''] // No state highlighted by default
				});

				// Listen to changes in the selected state
				selectedState.subscribe((stateName) => {
					if (stateName) {

						map.setFilter('state-highlight', ['==',  ['get', 'shapeName'], stateName]);

						// Zoom to the selected state
						const features = map.queryRenderedFeatures({
							layers: ['state-boundaries'],
							filter: ['==', 'shapeName', stateName]
						});


						// if (features.length > 0) {
						// 	// Calculate the bounding box of all features
						// 	const bounds = features.reduce((bbox, feature) => {
						// 		//console.error('Box:', bbox);
						// 		const [minX, minY, maxX, maxY] = bbox;
						// 		const [x1, y1, x2, y2] = feature.geometry.type === 'Point'
						// 		? [feature.geometry.coordinates[0], feature.geometry.coordinates[1], feature.geometry.coordinates[0], feature.geometry.coordinates[1]]
						// 		: feature.geometry.coordinates.flat(2).reduce(
						// 			(extent, coord) =>
						// 			{
						// 				//console.error('Here:', coord);

						// 				[
						// 				Math.min(extent, coord),
						// 				Math.min(extent, coord),
						// 				Math.max(extent, coord),
						// 				Math.max(extent, coord),
						// 			]},
						// 			[Infinity, Infinity, -Infinity, -Infinity]
						// 			);
						// 			return [ Math.min(minX, x1), Math.min(minY, y1), Math.max(maxX, x2), Math.max(maxY, y2) ];
						// 	}, [Infinity, Infinity, -Infinity, -Infinity]);
						// 	console.error('Box:', bounds);
						// 	map.fitBounds(bounds, { padding: 40 });
						// } else {
						// 	//map.zoomToLayer()
						// 	//console.error('No matching features found for state:', stateName);
						// }
					} else {
						// Clear the highlight if no state is selected
						map.setFilter('state-highlight', ['==', 'shapeName', '']);
					}
				});

		   	})});
			
			return () => map.remove();
		});

	// Public function to reset the map
	export function resetMap() {
		map.flyTo({ center: originalCenter, zoom: originalZoom });
		map.setFilter('state-highlight', ['==', 'shapeName', '']);
		selectedState.set('');
	}
</script>

<div class="relative w-full h-full">
	<div bind:this={mapContainer} class="w-full h-full"></div>
</div>
