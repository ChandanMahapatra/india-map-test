<script lang="ts">
	import { base } from '$app/paths';
	import type {
		GeoJSONSource,
		LngLat,
		LngLatBounds,
		LngLatBoundsLike,
		Map as MapLibreMap,
		Popup
	} from 'maplibre-gl';
	import { onDestroy, onMount } from 'svelte';
	import { get, type Writable } from 'svelte/store';

	interface StateAccident {
		state_name: string;
		total_accidents_2022: number;
		rank_2022: number;
	}

	type MapStatus = 'loading' | 'ready' | 'error' | 'unsupported';

	export let selectedState: Writable<string>;
	export let stateAccidents: StateAccident[] = [];

	let maplibre: typeof import('maplibre-gl') | null = null;
	let map: MapLibreMap | null = null;
	let mapContainer: HTMLDivElement;
	let popup: Popup | null = null;
	let geojsonCache: GeoJSON.FeatureCollection | null = null;
	let hoveredState = '';
	let mapStatus: MapStatus = 'loading';
	let statusMessage = 'Loading map…';
	let unsubscribeSelectedState: (() => void) | undefined;

	const indiaBounds: LngLatBoundsLike = [68.1, 6.5, 97.4, 35.5];
	const geojsonUrl = `${base}/geoBoundaries-IND-ADM1_simplified.geojson`;
	const legendItems = [
		{ color: '#dbeafe', label: 'Under 10K' },
		{ color: '#bfdbfe', label: '10K–20K' },
		{ color: '#93c5fd', label: '20K–35K' },
		{ color: '#3b82f6', label: '35K–50K' },
		{ color: '#1d4ed8', label: '50K+' }
	];

	$: if (geojsonCache && map?.getSource('india-states') && stateAccidents.length) {
		attachAccidentData(geojsonCache);
		(map.getSource('india-states') as GeoJSONSource).setData(geojsonCache);
	}

	function normalizeName(value: string): string {
		return value
			.trim()
			.toLowerCase()
			.replace(/&/g, 'and')
			.replace(/[^a-z0-9]/g, '');
	}

	function getStateName(feature: GeoJSON.Feature): string {
		return String(feature.properties?.shapeName ?? feature.properties?.st_nm ?? '');
	}

	function getMatchingAccident(stateName: string): StateAccident | undefined {
		const normalized = normalizeName(stateName);
		return stateAccidents.find((item) => normalizeName(item.state_name) === normalized);
	}

	function attachAccidentData(collection: GeoJSON.FeatureCollection): void {
		for (const feature of collection.features) {
			const stateName = getStateName(feature);
			const accident = getMatchingAccident(stateName);
			feature.properties = {
				...feature.properties,
				stateName: accident?.state_name ?? stateName,
				accidents: accident?.total_accidents_2022 ?? null,
				rank: accident?.rank_2022 ?? null
			};
		}
	}

	function showMapError(message: string): void {
		mapStatus = 'error';
		statusMessage = message;
	}

	function supportsWebGL(): boolean {
		try {
			const canvas = document.createElement('canvas');
			return Boolean(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
		} catch {
			return false;
		}
	}

	async function initMap(): Promise<void> {
		mapStatus = 'loading';
		statusMessage = 'Loading map…';
		popup?.remove();
		map?.remove();
		popup = null;
		map = null;

		if (!supportsWebGL()) {
			mapStatus = 'unsupported';
			statusMessage = 'The interactive map is unavailable in this browser.';
			return;
		}

		try {
			maplibre ??= await import('maplibre-gl');
			const mapInstance = new maplibre.Map({
				container: mapContainer,
				style: {
					version: 8,
					sources: {},
					layers: [
						{
							id: 'background',
							type: 'background',
							paint: { 'background-color': '#edf3f7' }
						}
					]
				},
				bounds: indiaBounds,
				fitBoundsOptions: { padding: 44, duration: 0 },
				attributionControl: false,
				maxZoom: 10
			});
			map = mapInstance;

			mapInstance.addControl(
				new maplibre.NavigationControl({ showZoom: true, showCompass: false }),
				'top-right'
			);
			mapInstance.addControl(new maplibre.ScaleControl({ unit: 'metric' }), 'bottom-left');
			mapInstance.once('load', loadStateBoundaries);
		} catch (error) {
			console.error('Unable to initialize MapLibre:', error);
			showMapError('The interactive map could not start.');
		}
	}

	async function loadStateBoundaries(): Promise<void> {
		try {
			const response = await fetch(geojsonUrl);
			if (!response.ok) throw new Error(`Boundary request failed (${response.status})`);
			const collection = (await response.json()) as GeoJSON.FeatureCollection;
			if (!collection.features?.length) throw new Error('Boundary file contains no features');

			geojsonCache = collection;
			attachAccidentData(collection);
			addStateLayers(collection);
			setupMapInteractions();
			map?.fitBounds(indiaBounds, { padding: 44, duration: 0 });
			mapStatus = 'ready';
			statusMessage = 'Map ready';
			handleSelectedState(get(selectedState));
		} catch (error) {
			console.error('Unable to load state boundaries:', error);
			showMapError('State boundaries could not be loaded.');
		}
	}

	function addStateLayers(collection: GeoJSON.FeatureCollection): void {
		if (!map) return;
		map.addSource('india-states', { type: 'geojson', data: collection, tolerance: 1 });
		map.addLayer({
			id: 'state-fill',
			type: 'fill',
			source: 'india-states',
			paint: {
				'fill-color': [
					'step',
					['coalesce', ['get', 'accidents'], -1],
					'#d7dee3',
					0,
					legendItems[0].color,
					10000,
					legendItems[1].color,
					20000,
					legendItems[2].color,
					35000,
					legendItems[3].color,
					50000,
					legendItems[4].color
				],
				'fill-opacity': 0.92
			}
		});
		map.addLayer({
			id: 'state-boundaries',
			type: 'line',
			source: 'india-states',
			paint: { 'line-color': '#ffffff', 'line-width': 1.25, 'line-opacity': 0.9 }
		});
		map.addLayer({
			id: 'state-hover',
			type: 'line',
			source: 'india-states',
			paint: { 'line-color': '#0f172a', 'line-width': 2.5 },
			filter: ['==', ['get', 'stateName'], '']
		});
		map.addLayer({
			id: 'state-selection',
			type: 'line',
			source: 'india-states',
			paint: { 'line-color': '#f97316', 'line-width': 4 },
			filter: ['==', ['get', 'stateName'], '']
		});
	}

	function setupMapInteractions(): void {
		if (!map) return;
		map.on('mouseenter', 'state-fill', () => {
			if (map) map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', 'state-fill', () => {
			if (!map) return;
			map.getCanvas().style.cursor = '';
			hoveredState = '';
			map.setFilter('state-hover', ['==', ['get', 'stateName'], '']);
		});
		map.on('mousemove', 'state-fill', (event) => {
			const stateName = String(event.features?.[0]?.properties?.stateName ?? '');
			if (!map || !stateName || stateName === hoveredState) return;
			hoveredState = stateName;
			map.setFilter('state-hover', ['==', ['get', 'stateName'], stateName]);
		});
		map.on('click', 'state-fill', (event) => {
			const feature = event.features?.[0];
			const stateName = String(feature?.properties?.stateName ?? '');
			if (!map || !feature || !stateName) return;
			selectedState.set(stateName);
			showPopup(stateName, event.lngLat);
		});
	}

	function showPopup(stateName: string, lngLat: LngLat): void {
		if (!map || !maplibre) return;
		const accident = getMatchingAccident(stateName);
		const content = document.createElement('div');
		content.className = 'map-popup';
		const eyebrow = document.createElement('p');
		eyebrow.className = 'map-popup__eyebrow';
		eyebrow.textContent = 'Reported road accidents · 2022';
		const title = document.createElement('h2');
		title.className = 'map-popup__title';
		title.textContent = stateName;
		const value = document.createElement('p');
		value.className = 'map-popup__value';
		value.textContent = accident
			? accident.total_accidents_2022.toLocaleString('en-IN')
			: 'No data';
		const rank = document.createElement('p');
		rank.className = 'map-popup__rank';
		rank.textContent = accident ? `Rank ${accident.rank_2022} of ${stateAccidents.length}` : '';
		content.append(eyebrow, title, value, rank);
		popup?.remove();
		popup = new maplibre.Popup({ closeButton: true, closeOnClick: true, maxWidth: '280px' })
			.setLngLat(lngLat)
			.setDOMContent(content)
			.addTo(map);
	}

	function boundsForState(stateName: string): LngLatBounds | null {
		const feature = geojsonCache?.features.find(
			(item) => String(item.properties?.stateName ?? '') === stateName
		);
		if (!feature) return null;

		if (!maplibre) return null;
		const bounds = new maplibre.LngLatBounds();
		const visitCoordinates = (coordinates: unknown): void => {
			if (!Array.isArray(coordinates)) return;
			if (
				coordinates.length >= 2 &&
				typeof coordinates[0] === 'number' &&
				typeof coordinates[1] === 'number'
			) {
				bounds.extend([coordinates[0], coordinates[1]]);
				return;
			}
			for (const coordinate of coordinates) visitCoordinates(coordinate);
		};
		visitCoordinates((feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon).coordinates);
		return bounds.isEmpty() ? null : bounds;
	}

	function handleSelectedState(stateName: string): void {
		if (!map || mapStatus !== 'ready') return;
		map.setFilter('state-selection', ['==', ['get', 'stateName'], stateName]);
		popup?.remove();
		popup = null;
		if (!stateName) {
			map.fitBounds(indiaBounds, { padding: 44, duration: 700 });
			return;
		}
		const bounds = boundsForState(stateName);
		if (bounds) {
			map.fitBounds(bounds, { padding: 72, duration: 700, maxZoom: 7 });
			showPopup(stateName, bounds.getCenter());
		}
	}

	onMount(() => {
		unsubscribeSelectedState = selectedState.subscribe(handleSelectedState);
		initMap();
	});

	onDestroy(() => {
		unsubscribeSelectedState?.();
		popup?.remove();
		map?.remove();
	});

	export function resetMap(): void {
		selectedState.set('');
	}
</script>

<div class="map-container" aria-label="India road accidents map">
	<div bind:this={mapContainer} class="map-canvas" aria-hidden={mapStatus !== 'ready'}></div>

	{#if mapStatus === 'loading'}
		<div class="map-state map-state--compact" role="status" aria-live="polite">
			<span class="spinner" aria-hidden="true"></span>
			<span>{statusMessage}</span>
		</div>
	{:else if mapStatus === 'error' || mapStatus === 'unsupported'}
		<section class="fallback" aria-labelledby="fallback-title">
			<div class="fallback__intro">
				<p class="eyebrow">{mapStatus === 'error' ? 'Map unavailable' : 'Accessible data view'}</p>
				<h2 id="fallback-title">Road accidents by state</h2>
				<p>{statusMessage} Browse the same 2022 figures in this list.</p>
				{#if mapStatus === 'error'}
					<button type="button" class="retry-button" onclick={initMap}>Try map again</button>
				{/if}
			</div>
			<div class="fallback__list">
				{#each stateAccidents as accident}
					<button
						type="button"
						class:selected={$selectedState === accident.state_name}
						onclick={() => selectedState.set(accident.state_name)}
					>
						<span>{accident.state_name}</span>
						<strong>{accident.total_accidents_2022.toLocaleString('en-IN')}</strong>
					</button>
				{/each}
			</div>
		</section>
	{/if}

	{#if mapStatus === 'ready'}
		<aside class="legend" aria-label="Accident count color legend">
			<p class="legend__title">Reported accidents</p>
			<p class="legend__year">2022 · number of incidents</p>
			<div class="legend__scale" aria-hidden="true">
				{#each legendItems as item}
					<span style:background={item.color}></span>
				{/each}
			</div>
			<div class="legend__labels"><span>Under 10K</span><span>50K+</span></div>
		</aside>
	{/if}
</div>

<style>
	.map-container,
	.map-canvas {
		position: relative;
		width: 100%;
		height: 100%;
	}
	.map-canvas {
		position: absolute;
		inset: 0;
	}
	.map-state {
		position: absolute;
		left: 50%;
		top: 50%;
		z-index: 5;
		width: min(420px, calc(100% - 32px));
		transform: translate(-50%, -50%);
		border: 1px solid #d8e1e8;
		border-radius: 16px;
		background: rgba(255, 255, 255, 0.96);
		padding: 28px;
		box-shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
		color: #334155;
	}
	.map-state--compact {
		display: flex;
		width: auto;
		align-items: center;
		gap: 10px;
		padding: 12px 16px;
		font-size: 0.875rem;
	}
	.eyebrow {
		margin: 0 0 8px;
		color: #2563eb;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.fallback h2 {
		margin: 0 0 8px;
		color: #0f172a;
		font-size: 1.25rem;
		line-height: 1.2;
	}
	.fallback__intro p:not(.eyebrow) {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.55;
	}
	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid #cbd5e1;
		border-top-color: #2563eb;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	.fallback {
		position: absolute;
		inset: 0;
		z-index: 4;
		display: grid;
		grid-template-columns: minmax(220px, 0.75fr) minmax(300px, 1.25fr);
		gap: 28px;
		overflow: auto;
		background: #edf3f7;
		padding: clamp(24px, 5vw, 64px);
	}
	.fallback__intro {
		max-width: 420px;
	}
	.retry-button {
		margin-top: 18px;
		border: 0;
		border-radius: 8px;
		background: #1d4ed8;
		padding: 9px 14px;
		color: #fff;
		font-weight: 650;
		cursor: pointer;
	}
	.fallback__list {
		display: grid;
		align-content: start;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}
	.fallback__list button {
		display: flex;
		min-height: 48px;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		border: 1px solid #d8e1e8;
		border-radius: 10px;
		background: #fff;
		padding: 10px 12px;
		color: #334155;
		text-align: left;
		cursor: pointer;
	}
	.fallback__list button:hover,
	.fallback__list button.selected {
		border-color: #2563eb;
		box-shadow: inset 0 0 0 1px #2563eb;
	}
	.fallback__list strong {
		color: #0f172a;
		font-variant-numeric: tabular-nums;
	}
	.legend {
		position: absolute;
		right: 16px;
		bottom: 28px;
		z-index: 3;
		width: 218px;
		border: 1px solid rgba(148, 163, 184, 0.35);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.94);
		padding: 14px;
		box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
		backdrop-filter: blur(8px);
	}
	.legend__title,
	.legend__year {
		margin: 0;
	}
	.legend__title {
		color: #0f172a;
		font-size: 0.78rem;
		font-weight: 700;
	}
	.legend__year {
		margin-top: 1px;
		color: #64748b;
		font-size: 0.69rem;
	}
	.legend__scale {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		height: 9px;
		margin-top: 10px;
		overflow: hidden;
		border-radius: 4px;
	}
	.legend__labels {
		display: flex;
		justify-content: space-between;
		margin-top: 4px;
		color: #64748b;
		font-size: 0.65rem;
	}
	:global(.maplibregl-popup-content) {
		border: 1px solid #d8e1e8;
		border-radius: 12px;
		padding: 0;
		box-shadow: 0 16px 36px rgba(15, 23, 42, 0.18);
	}
	:global(.maplibregl-popup-close-button) {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		color: #64748b;
		font-size: 20px;
	}
	:global(.maplibregl-popup-close-button:hover) {
		background: #f1f5f9;
		color: #0f172a;
	}
	:global(.maplibregl-popup-tip) {
		display: none;
	}
	:global(.map-popup) {
		min-width: 220px;
		padding: 18px;
		font-family: inherit;
	}
	:global(.map-popup__eyebrow) {
		margin: 0 24px 8px 0;
		color: #64748b;
		font-size: 0.68rem;
		font-weight: 650;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	:global(.map-popup__title) {
		margin: 0;
		color: #0f172a;
		font-size: 1rem;
		font-weight: 700;
	}
	:global(.map-popup__value) {
		margin: 12px 0 0;
		color: #1d4ed8;
		font-size: 1.6rem;
		font-weight: 750;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}
	:global(.map-popup__rank) {
		margin: 6px 0 0;
		color: #64748b;
		font-size: 0.76rem;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (max-width: 680px) {
		.legend {
			right: 10px;
			bottom: 26px;
			width: 176px;
			padding: 11px;
		}
		.fallback {
			display: block;
			padding: 28px 16px;
		}
		.fallback__list {
			grid-template-columns: 1fr;
			margin-top: 22px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}
	}
</style>
