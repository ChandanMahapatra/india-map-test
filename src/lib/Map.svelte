<script lang="ts">
	import maplibregl from 'maplibre-gl';
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';

	interface StateAccident {
		state_name: string;
		total_accidents_2022: number;
		rank_2022: number;
	}

	export let selectedState = writable('');
	export let stateAccidents: StateAccident[] | undefined;

	let map: maplibregl.Map | null = null;
	let mapContainer: HTMLElement | null = null;
	let popup: maplibregl.Popup | null = null;
	let hoveredStateId: string | number | null = null;
	let stateDataLoaded = false;
	let geojsonCache: any = null;
	let previousStateAccidentsJson: string = '';
	let updateAttempts = 0;

	$: {
		if (stateAccidents && stateAccidents.length > 0 && geojsonCache && map) {
			const newJson = JSON.stringify(stateAccidents);
			if (newJson !== previousStateAccidentsJson) {
				previousStateAccidentsJson = newJson;
				updateAttempts++;
				console.log(
					`[Map] Updating GeoJSON with accident data (attempt ${updateAttempts}), states loaded: ${stateAccidents.length}`
				);
				updateGeoJSONWithAccidentData(geojsonCache);
			}
		} else if (stateAccidents && stateAccidents.length === 0) {
			console.log('[Map] Waiting for CSV data...');
		}
	}

	const originalCenter: [number, number] = [78.9629, 20.5937];
	const originalZoom = 4;

	const geojsonUrl =
		import.meta.env.MODE === 'development'
			? '/geoBoundaries-IND-ADM1_simplified.geojson'
			: 'https://raw.githubusercontent.com/ChandanMahapatra/india-map-test/gh-pages/india-states.geojson';

	const colorPalette = ['#8DD3C7', '#FFFFB3', '#BEBADA', '#FB8072', '#80B1D3'];

	const styleUrl = 'https://tiles.openfreemap.org/styles/bright';

	const stateNameMapping: Record<string, string> = {
		'Andaman & Nicobar Island': 'Andaman and Nicobar Islands',
		'Daman & Diu': 'D & N Haveli & Daman & Diu',
		'NCT of Delhi': 'Delhi',
		'Jammu & Kashmir': 'Jammu and Kashmir',
		'Dadara & Nagar Havelli': 'D & N Haveli & Daman & Diu',
		Puducherry: 'Pondicherry'
	};

	function normalizeString(str: string): string {
		if (!str) return '';
		return str
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '');
	}

	function getStateName(props: any): string | undefined {
		return props.shapeName || props.st_nm;
	}

	function getMatchingAccident(geojsonName: string): StateAccident | undefined {
		if (!geojsonName || !stateAccidents || stateAccidents.length === 0) {
			return undefined;
		}

		const normalized = normalizeString(geojsonName);

		for (const accident of stateAccidents) {
			const csvName = normalizeString(accident.state_name);
			if (csvName === normalized) {
				return accident;
			}
		}

		return undefined;
	}

	function updateGeoJSONWithAccidentData(geojsonData: any): void {
		if (!map) return;

		let matched = 0;
		let unmatched: string[] = [];

		geojsonData.features.forEach((feature: any) => {
			const geojsonStateName = getStateName(feature.properties);
			const accidentData = getMatchingAccident(geojsonStateName || '');

			feature.properties.accidentsStat = accidentData || null;
			feature.properties.accidents = accidentData ? accidentData.total_accidents_2022 : null;

			if (accidentData) {
				matched++;
			} else if (geojsonStateName) {
				unmatched.push(geojsonStateName);
			}
		});

		console.log(
			`[Map] Updated ${matched} states with accident data, ${unmatched.length} unmatched:`,
			unmatched.slice(0, 5)
		);

		const source = map.getSource('india-states') as maplibregl.GeoJSONSource;
		if (source) {
			source.setData(geojsonData);
			console.log('[Map] GeoJSON source updated successfully');
		} else {
			console.error('[Map] GeoJSON source not found!');
		}
	}

	async function initMap(): Promise<void> {
		if (!mapContainer) return;

		map = new maplibregl.Map({
			container: mapContainer,
			style: styleUrl,
			center: originalCenter,
			zoom: originalZoom,
			attributionControl: { compact: true }
		});

		map.addControl(
			new maplibregl.NavigationControl({ showZoom: true, showCompass: false }),
			'top-right'
		);
		map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

		map.on('load', () => {
			loadStateBoundaries();
		});
	}

	async function loadStateBoundaries(): Promise<void> {
		if (!map) return;

		try {
			const response = await fetch(geojsonUrl);
			if (!response.ok) throw new Error('HTTP error! Status: ' + response.status);
			const geojsonData = await response.json();

			geojsonCache = geojsonData;
			stateDataLoaded = true;

			addStateLayers(geojsonData);
			setupEventHandlers();

			map?.fitBounds([68.1, 6.5, 97.4, 35.5], { padding: 50, duration: 0 });
		} catch (error) {
			console.error('Error loading GeoJSON:', error);
		}
	}

	function addStateLayers(geojsonData: any): void {
		if (!map) return;

		geojsonData.features.forEach((feature: any) => {
			const geojsonStateName = getStateName(feature.properties);
			const accidentData = getMatchingAccident(geojsonStateName || '');

			feature.properties.accidentsStat = accidentData || null;
			feature.properties.accidents = accidentData ? accidentData.total_accidents_2022 : null;
			feature.properties.stateName = geojsonStateName;
			feature.properties.displayStateName = geojsonStateName || '';
		});

		const source = map.getSource('india-states');
		if (source && (source as maplibregl.GeoJSONSource).setData) {
			(source as maplibregl.GeoJSONSource).setData(geojsonData);
		} else {
			map.addSource('india-states', {
				type: 'geojson',
				data: geojsonData,
				tolerance: 1
			});
		}

		const layerIds = [
			'state-fill',
			'state-fill-hover',
			'state-boundaries',
			'state-hover-outline',
			'state-highlight'
		];
		layerIds.forEach((id) => {
			if (map?.getLayer(id)) {
				map.removeLayer(id);
			}
		});

		map.addLayer({
			id: 'state-fill',
			type: 'fill',
			source: 'india-states',
			paint: {
				'fill-color': [
					'interpolate',
					['linear'],
					['get', 'accidents'],
					0,
					colorPalette[0],
					10000,
					colorPalette[1],
					20000,
					colorPalette[2],
					35000,
					colorPalette[3],
					50000,
					colorPalette[4]
				],
				'fill-opacity': 0.7
			},
			filter: ['!=', ['get', 'accidents'] as any, null] as any
		});

		map.addLayer({
			id: 'state-fill-hover',
			type: 'fill',
			source: 'india-states',
			paint: {
				'fill-color': [
					'interpolate',
					['linear'],
					['get', 'accidents'],
					0,
					colorPalette[0],
					10000,
					colorPalette[1],
					20000,
					colorPalette[2],
					35000,
					colorPalette[3],
					50000,
					colorPalette[4]
				],
				'fill-opacity': 0.4
			},
			filter: ['==', ['get', 'stateName'] as any, ''] as any
		});

		map.addLayer({
			id: 'state-boundaries',
			type: 'line',
			source: 'india-states',
			paint: {
				'line-color': '#999999',
				'line-width': 1,
				'line-opacity': 0.8
			}
		});

		map.addLayer({
			id: 'state-hover-outline',
			type: 'line',
			source: 'india-states',
			paint: {
				'line-color': '#333333',
				'line-width': 3,
				'line-opacity': 1
			},
			filter: ['==', ['get', 'stateName'] as any, ''] as any
		});

		map.addLayer({
			id: 'state-highlight',
			type: 'fill',
			source: 'india-states',
			paint: {
				'fill-color': '#FF0000',
				'fill-opacity': 0.5
			},
			filter: ['==', ['get', 'stateName'] as any, ''] as any
		});
	}

	function setupEventHandlers(): void {
		if (!map) return;

		map.off('mouseenter', 'state-fill');
		map.off('mouseleave', 'state-fill');
		map.off('mousemove', 'state-fill');
		map.off('click', 'state-fill');
		map.off('click');

		// @ts-ignore
		map.on('mouseenter', 'state-fill', () => {
			const canvas = map?.getCanvas();
			if (canvas) canvas.style.cursor = 'pointer';
		});

		// @ts-ignore
		map.on('mouseleave', 'state-fill', () => {
			const canvas = map?.getCanvas();
			if (canvas) canvas.style.cursor = '';
		});

		// @ts-ignore
		map.on('mousemove', 'state-fill', (e: any) => {
			const m = map;
			if (!m || !m.getLayer('state-fill')) return;

			const features = m.queryRenderedFeatures(e.point, {
				layers: ['state-fill']
			});

			if (features.length > 0) {
				const feature = features[0];
				const stateName = feature.properties?.stateName;

				if (stateName && stateName !== hoveredStateId) {
					hoveredStateId = stateName;
					if (m.getLayer('state-hover-outline')) {
						m.setFilter('state-hover-outline', [
							'==',
							['get', 'stateName'] as any,
							stateName
						] as any);
					}
					if (m.getLayer('state-fill-hover')) {
						m.setFilter('state-fill-hover', ['==', ['get', 'stateName'] as any, stateName] as any);
					}
				}
			} else if (hoveredStateId !== null) {
				hoveredStateId = null;
				if (m.getLayer('state-hover-outline')) {
					m.setFilter('state-hover-outline', ['==', ['get', 'stateName'] as any, ''] as any);
				}
				if (m.getLayer('state-fill-hover')) {
					m.setFilter('state-fill-hover', ['==', ['get', 'stateName'] as any, ''] as any);
				}
			}
		});

		// @ts-ignore
		map.on('click', 'state-fill', (e: any) => {
			const m = map;
			if (!m || !e.features || e.features.length === 0) return;

			const feature = e.features[0];
			const stateName = feature.properties?.displayStateName || feature.properties?.stateName;

			if (stateName) {
				selectedState.set(stateName);

				const displayName = feature.properties?.displayStateName || stateName;
				const matchingAccident = getMatchingAccident(displayName);

				console.log(
					'[Popup] Clicked state:',
					stateName,
					'displayName:',
					displayName,
					'matchingAccident:',
					matchingAccident
				);

				if (popup) popup.remove();
				popup = new maplibregl.Popup({
					closeButton: true,
					closeOnClick: true,
					maxWidth: '280px'
				})
					.setLngLat(e.lngLat)
					.setHTML(
						'<div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif;">' +
							'<h3 style="margin: 0 0 10px 0; font-weight: 600; font-size: 15px; color: #1f2937;">' +
							stateName +
							'</h3>' +
							'<p style="margin: 6px 0; font-size: 13px; color: #374151;">' +
							'<strong style="color: #111827;">2022 Accidents:</strong> ' +
							(matchingAccident
								? String(matchingAccident.total_accidents_2022).replace(
										/\B(?=(\d{3})+(?!\d))/g,
										','
									)
								: 'N/A') +
							'</p>' +
							'<p style="margin: 6px 0; font-size: 13px; color: #374151;">' +
							'<strong style="color: #111827;">Rank:</strong> ' +
							(matchingAccident ? matchingAccident.rank_2022 : 'N/A') +
							'</p>' +
							'</div>'
					)
					.addTo(m);
			}
		});

		// @ts-ignore
		map.on('click', (e: any) => {
			const m = map;
			if (!m || !m.getLayer('state-fill')) return;
			const features = m.queryRenderedFeatures(e.point, {
				layers: ['state-fill']
			});
			if (!features || features.length === 0) {
				if (popup) {
					popup.remove();
					popup = null;
				}
			}
		});
	}

	function setupSelectedStateHandler(): void {
		selectedState.set('');

		selectedState.subscribe((stateName) => {
			const m = map;
			if (!m) return;

			if (stateName) {
				if (m.getLayer('state-highlight')) {
					m.setFilter('state-highlight', [
						'==',
						['get', 'displayStateName'] as any,
						stateName
					] as any);
				}
				if (popup) {
					popup.remove();
					popup = null;
				}

				if (m.getLayer('state-boundaries')) {
					const features = m.queryRenderedFeatures({
						layers: ['state-boundaries'],
						filter: ['==', 'displayStateName', stateName]
					});

					if (features.length > 0) {
						const bounds = calculateBounds(features);
						if (bounds) {
							m.fitBounds(bounds, { padding: 80, duration: 1000 });
						}
					}
				}
			} else {
				if (m.getLayer('state-highlight')) {
					m.setFilter('state-highlight', ['==', ['get', 'stateName'] as any, ''] as any);
				}
			}
		});
	}

	function calculateBounds(features: any[]): maplibregl.LngLatBounds | null {
		if (!features.length) return null;

		const bounds = new maplibregl.LngLatBounds();

		features.forEach((feature) => {
			const geometry = feature.geometry;

			if (geometry.type === 'Point') {
				bounds.extend([geometry.coordinates[0] as number, geometry.coordinates[1] as number]);
			} else if (geometry.type === 'Polygon') {
				geometry.coordinates[0].forEach((coord: number[]) => {
					bounds.extend(coord as [number, number]);
				});
			} else if (geometry.type === 'MultiPolygon') {
				geometry.coordinates.forEach((polygon: number[][][]) => {
					polygon[0].forEach((coord: number[]) => {
						bounds.extend(coord as [number, number]);
					});
				});
			}
		});

		return bounds;
	}

	onMount(() => {
		initMap();
		setupSelectedStateHandler();
	});

	onDestroy(() => {
		if (popup) popup.remove();
		if (map) map.remove();
	});

	export function resetMap(): void {
		const m = map;
		if (m) {
			m.flyTo({ center: originalCenter, zoom: originalZoom, duration: 1500 });
			m.fitBounds([68.1, 6.5, 97.4, 35.5], { padding: 50, duration: 1500 });
		}
		selectedState.set('');
		if (popup) {
			popup.remove();
			popup = null;
		}
	}
</script>

<div class="map-container" role="application" aria-label="India Road Accidents Map">
	<div bind:this={mapContainer} class="map-canvas"></div>
</div>

<style>
	.map-container {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.map-canvas {
		width: 100%;
		height: 100%;
	}

	:global(.maplibregl-popup-close-button) {
		position: absolute;
		top: 2px;
		right: 2px;
		width: 20px;
		height: 20px;
		padding: 0;
		margin: 0;
		border: none;
		background: transparent;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
		font-weight: bold;
		line-height: 1;
		color: #666;
		transition:
			background-color 0.2s,
			color 0.2s;
		z-index: 10;
	}

	:global(.maplibregl-popup-close-button:hover) {
		background: rgba(0, 0, 0, 0.1);
		color: #000;
	}

	:global(.maplibregl-popup-content) {
		padding: 0 !important;
		border-radius: 8px !important;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
		overflow: hidden;
	}

	:global(.maplibregl-popup) {
		max-width: 260px !important;
	}

	:global(.maplibregl-popup-tip) {
		display: none;
	}
</style>
