import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { boundsOf, EMPTY_COLLECTION } from './aoi.js';
import { ACCIDENT_COLORS, ACCIDENT_STOPS } from './accidents.js';

const accidentPaint = [
	'case',
	['==', ['get', 'accidents'], null],
	'#e7e9e8',
	[
		'step',
		['get', 'accidents'],
		ACCIDENT_COLORS[0],
		...ACCIDENT_STOPS.flatMap((stop, index) => [stop, ACCIDENT_COLORS[index + 1]])
	]
];

const graticule = {
	type: 'FeatureCollection',
	features: [
		...Array.from({ length: 12 }, (_, i) => ({
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'LineString',
				coordinates: [
					[55 + i * 5, -5],
					[55 + i * 5, 45]
				]
			}
		})),
		...Array.from({ length: 11 }, (_, i) => ({
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'LineString',
				coordinates: [
					[55, -5 + i * 5],
					[110, -5 + i * 5]
				]
			}
		}))
	]
};
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Local political-boundary-free style. All administrative lines come from supplied datasets. */
export const MapView = forwardRef(function MapView(
	{
		country,
		activeCollection,
		accidentCollection = EMPTY_COLLECTION,
		selection,
		onSelect,
		onViewport,
		onHover,
		onError,
		onReady
	},
	ref
) {
	const container = useRef(null);
	const instance = useRef(null);
	const callbacks = useRef({ onSelect, onViewport, onHover, onError, onReady });
	callbacks.current = { onSelect, onViewport, onHover, onError, onReady };
	const data = useRef({ activeCollection, selection, accidentCollection });
	data.current = { activeCollection, selection, accidentCollection };
	const [ready, setReady] = useState(false);
	const fit = (bounds, animate = true) =>
		instance.current?.fitBounds(
			[
				[bounds[0], bounds[1]],
				[bounds[2], bounds[3]]
			],
			{ padding: 60, maxZoom: 10, duration: animate && !reducedMotion() ? 500 : 0 }
		);
	useImperativeHandle(
		ref,
		() => ({
			fit: (geometry) => fit(boundsOf(geometry)),
			home: () => fit(boundsOf(country)),
			zoom: (delta) =>
				instance.current?.zoomTo(instance.current.getZoom() + delta, {
					duration: reducedMotion() ? 0 : 200
				}),
			extent: () => {
				const bounds = instance.current?.getBounds();
				return bounds
					? [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
					: null;
			},
			ready
		}),
		[country, ready]
	);

	useEffect(() => {
		let map,
			observer,
			disposed = false;
		let hovered = null;
		setReady(false);
		callbacks.current.onReady?.(false);
		try {
			map = new maplibregl.Map({
				container: container.current,
				style: {
					version: 8,
					glyphs: `${window.location.origin}${import.meta.env.BASE_URL}fonts/{fontstack}/{range}.pbf`,
					sources: {},
					layers: [
						{ id: 'background', type: 'background', paint: { 'background-color': '#e9f0ef' } }
					]
				},
				center: [82, 22],
				zoom: 3.5,
				minZoom: 1.5,
				maxZoom: 14,
				maxBounds: [
					[35, -25],
					[130, 60]
				],
				attributionControl: false,
				renderWorldCopies: false
			});
			instance.current = map;
			map
				.getCanvas()
				.setAttribute(
					'aria-label',
					'India map. Pan with arrow keys and zoom with plus or minus. Select areas using the adjacent area list.'
				);
			map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');
			map.on('load', () => {
				if (disposed) return;
				map.addSource('grid', { type: 'geojson', data: graticule });
				map.addLayer({
					id: 'grid',
					type: 'line',
					source: 'grid',
					paint: { 'line-color': '#b8ccca', 'line-width': 0.7, 'line-opacity': 0.3 }
				});
				map.addSource('country', { type: 'geojson', data: country, promoteId: 'aoi_id' });
				map.addLayer({
					id: 'country-fill',
					type: 'fill',
					source: 'country',
					paint: { 'fill-color': '#fcfdfb' }
				});
				map.addSource('areas', {
					type: 'geojson',
					data: data.current.activeCollection,
					promoteId: 'aoi_id'
				});
				map.addSource('accidents', {
					type: 'geojson',
					data: data.current.accidentCollection,
					promoteId: 'aoi_id'
				});
				map.addLayer({
					id: 'accident-fill',
					type: 'fill',
					source: 'accidents',
					paint: { 'fill-color': accidentPaint, 'fill-opacity': 0.85 }
				});
				map.addLayer({
					id: 'areas-fill',
					type: 'fill',
					source: 'areas',
					paint: {
						'fill-color': '#a9d2c8',
						'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.4, 0.06]
					}
				});
				map.addLayer({
					id: 'areas-lines',
					type: 'line',
					source: 'areas',
					paint: {
						'line-color': '#768d83',
						'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.65, 8, 1.1]
					}
				});
				map.addLayer({
					id: 'country-outline',
					type: 'line',
					source: 'country',
					paint: { 'line-color': '#708c80', 'line-width': 1.2 }
				});
				map.addSource('selection', {
					type: 'geojson',
					data: data.current.selection,
					promoteId: 'aoi_id'
				});
				map.addLayer({
					id: 'selection-fill',
					type: 'fill',
					source: 'selection',
					paint: { 'fill-color': '#188875', 'fill-opacity': 0.08 }
				});
				map.addLayer({
					id: 'selection-halo',
					type: 'line',
					source: 'selection',
					paint: { 'line-color': '#ffffff', 'line-width': 6, 'line-opacity': 0.95 }
				});
				map.addLayer({
					id: 'selection-lines',
					type: 'line',
					source: 'selection',
					paint: { 'line-color': '#064f46', 'line-width': 3 }
				});
				map.addSource('labels', {
					type: 'geojson',
					data: `${import.meta.env.BASE_URL}map-labels.geojson`
				});
				const labelLayout = {
					'text-field': ['get', 'name'],
					'text-font': ['Noto Sans Regular'],
					'text-max-width': 9,
					'text-padding': 5
				};
				const labelPaint = {
					'text-color': '#203c33',
					'text-halo-color': '#ffffff',
					'text-halo-width': 1.5,
					'text-halo-blur': 0.5
				};
				map.addLayer({
					id: 'context-labels',
					type: 'symbol',
					source: 'labels',
					filter: ['in', ['get', 'kind'], ['literal', ['country', 'water']]],
					maxzoom: 8,
					layout: {
						...labelLayout,
						'text-size': ['match', ['get', 'kind'], 'water', 13, 12],
						'text-letter-spacing': 0.06
					},
					paint: {
						...labelPaint,
						'text-color': ['match', ['get', 'kind'], 'water', '#567d87', '#687b73'],
						'text-halo-color': '#e9f0ef'
					}
				});
				map.addLayer({
					id: 'india-label',
					type: 'symbol',
					source: 'labels',
					filter: ['==', ['get', 'kind'], 'india'],
					maxzoom: 4.3,
					layout: { ...labelLayout, 'text-size': 22, 'text-letter-spacing': 0.12 },
					paint: labelPaint
				});
				map.addLayer({
					id: 'state-labels',
					type: 'symbol',
					source: 'labels',
					filter: ['==', ['get', 'kind'], 'state'],
					minzoom: 3.2,
					layout: {
						...labelLayout,
						'text-size': ['interpolate', ['linear'], ['zoom'], 3.2, 10, 6, 13],
						'text-variable-anchor': ['center', 'top', 'bottom', 'left', 'right'],
						'text-radial-offset': 0.4
					},
					paint: labelPaint
				});
				// Country context takes priority over state labels at the overview zoom.
				map.moveLayer('context-labels');
				map.moveLayer('india-label');
				map.on('click', 'areas-fill', (event) => {
					const feature = event.features?.[0];
					if (feature) callbacks.current.onSelect?.(String(feature.properties.aoi_id));
				});
				map.on('mousemove', 'areas-fill', (event) => {
					const feature = event.features?.[0];
					if (hovered !== null)
						map.setFeatureState({ source: 'areas', id: hovered }, { hover: false });
					hovered = feature?.id ?? null;
					if (hovered !== null)
						map.setFeatureState({ source: 'areas', id: hovered }, { hover: true });
					map.getCanvas().style.cursor = 'pointer';
					callbacks.current.onHover?.(feature?.properties.aoi_name ?? '');
				});
				map.on('mouseleave', 'areas-fill', () => {
					if (hovered !== null)
						map.setFeatureState({ source: 'areas', id: hovered }, { hover: false });
					hovered = null;
					map.getCanvas().style.cursor = '';
					callbacks.current.onHover?.('');
				});
				fit(boundsOf(country), false);
				setReady(true);
				callbacks.current.onReady?.(true);
			});
			map.on('moveend', () =>
				callbacks.current.onViewport?.({ zoom: map.getZoom(), center: map.getCenter().toArray() })
			);
			map.on('error', (event) => {
				if (!disposed) callbacks.current.onError?.(event.error?.message ?? 'Map rendering failed.');
			});
			map.on('webglcontextlost', () => {
				if (disposed) return;
				callbacks.current.onReady?.(false);
				callbacks.current.onError?.(
					'The map lost its graphics context. Reload to restore map interactions.'
				);
			});
			map.on('webglcontextrestored', () => {
				if (disposed) return;
				callbacks.current.onError?.('');
				callbacks.current.onReady?.(true);
			});
			let previousWidth = container.current.clientWidth;
			observer = new ResizeObserver(() => {
				const width = container.current?.clientWidth ?? previousWidth;
				const majorResize = Math.abs(width - previousWidth) > previousWidth * 0.25;
				previousWidth = width;
				map.resize();
				if (majorResize && map.getSource('country')) {
					fit(
						boundsOf(data.current.selection.features.length ? data.current.selection : country),
						false
					);
				}
			});
			observer.observe(container.current);
		} catch (error) {
			callbacks.current.onError?.(error.message);
		}
		return () => {
			disposed = true;
			observer?.disconnect();
			map?.remove();
			instance.current = null;
		};
	}, [country]);

	useEffect(() => {
		const map = instance.current;
		if (!ready || !map) return;
		map.removeFeatureState({ source: 'areas' });
		map.getSource('areas').setData(activeCollection ?? EMPTY_COLLECTION);
		callbacks.current.onHover?.('');
	}, [activeCollection, ready]);
	useEffect(() => {
		if (!ready) return;
		instance.current.getSource('selection').setData(selection);
	}, [selection, ready]);
	useEffect(() => {
		if (!ready) return;
		instance.current.getSource('accidents').setData(accidentCollection);
	}, [accidentCollection, ready]);
	return <div ref={container} className="map-canvas" />;
});
