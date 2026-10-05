import { useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import { Dialog } from '@base-ui/react/dialog';
import { Input } from '@base-ui/react/input';
import { Select } from '@base-ui/react/select';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { MapView } from './lib/MapView.jsx';
import { Icon } from './lib/Icons.jsx';
import { AccidentOverview } from './lib/AccidentOverview.jsx';
import {
	accidentSummary,
	accidentMapCollection,
	formatAccidents,
	ACCIDENT_COLORS
} from './lib/accidents.js';
import {
	EMPTY_COLLECTION,
	exportSelection,
	normalizeCollection,
	selectFeatures
} from './lib/aoi.js';

// Enable district selection in integrations with district-level observations.
const enabledLevels = ['state'];
const levelLabels = {
	state: 'States & UTs',
	district: 'Districts'
};
async function readJson(url, signal) {
	const response = await fetch(`${import.meta.env.BASE_URL}${url}`, { signal });
	if (!response.ok) throw new Error(`Could not load ${url} (HTTP ${response.status}).`);
	return response.json();
}

function StateSelect({ states, value, onChange }) {
	const items = states.map((feature) => ({
		value: feature.id,
		label: feature.properties.aoi_name
	}));
	return (
		<Select.Root
			items={items}
			value={value || null}
			onValueChange={(value) => onChange(value ?? '')}
		>
			<Select.Trigger
				className="select-trigger"
				aria-label="State or union territory for districts"
			>
				<Select.Value placeholder="Choose a state or UT" />
				<Select.Icon>
					<Icon name="chevron" size={16} />
				</Select.Icon>
			</Select.Trigger>
			<Select.Portal>
				<Select.Positioner sideOffset={6} className="select-positioner">
					<Select.Popup className="select-popup">
						<Select.List>
							{items.map((item) => (
								<Select.Item key={item.value} value={item.value} className="select-item">
									<Select.ItemText>{item.label}</Select.ItemText>
									<Select.ItemIndicator>
										<Icon name="check" size={15} />
									</Select.ItemIndicator>
								</Select.Item>
							))}
						</Select.List>
					</Select.Popup>
				</Select.Positioner>
			</Select.Portal>
		</Select.Root>
	);
}

function SourceDialog({ manifest }) {
	return (
		<Dialog.Root>
			<Dialog.Trigger className="text-button source-trigger">
				<Icon name="info" size={15} />
				Boundary sources
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Backdrop className="dialog-backdrop" />
				<Dialog.Popup className="dialog-popup">
					<div className="dialog-heading">
						<div>
							<p className="eyebrow">DATA & REPRESENTATION</p>
							<Dialog.Title>India boundary sources</Dialog.Title>
						</div>
						<Dialog.Close className="icon-button" aria-label="Close boundary sources">
							<Icon name="close" />
						</Dialog.Close>
					</div>
					<Dialog.Description>
						Administrative geometry is supplied by Indian government sources. All displayed
						political lines come from these local datasets.
					</Dialog.Description>
					<div className="source-list">
						{manifest?.sources.map((source) => (
							<article key={source.id}>
								<h3>{source.label}</h3>
								<p>{source.provenance.name}</p>
								{source.provenance.date && (
									<p className="muted">Dataset snapshot: {source.provenance.date}</p>
								)}
								<a href={source.provenance.url} target="_blank" rel="noreferrer">
									View source <Icon name="arrow" size={14} />
								</a>
								{source.provenance.notes && (
									<p className="small muted">{source.provenance.notes}</p>
								)}
							</article>
						))}
					</div>
					<p className="small muted">District names and counts reflect the supplied snapshot.</p>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

export default function App() {
	const mapRef = useRef(null);
	const districtCache = useRef(new Map());
	const handledFitRequest = useRef(0);
	const [manifest, setManifest] = useState(null);
	const [accidentData, setAccidentData] = useState(null);
	const [accidentError, setAccidentError] = useState('');
	const [accidentAttempt, setAccidentAttempt] = useState(0);
	const [year, setYear] = useState(2022);
	const [allIndia, setAllIndia] = useState(true);
	const [collections, setCollections] = useState({});
	const [loadError, setLoadError] = useState('');
	const [attempt, setAttempt] = useState(0);
	const [districtAttempt, setDistrictAttempt] = useState(0);
	const [districtData, setDistrictData] = useState(EMPTY_COLLECTION);
	const [districtLoading, setDistrictLoading] = useState(false);
	const [districtError, setDistrictError] = useState('');
	const [mapError, setMapError] = useState('');
	const [mapReady, setMapReady] = useState(false);
	const [level, setLevel] = useState('state');
	const [scopeState, setScopeState] = useState('');
	const [selectedIds, setSelectedIds] = useState([]);
	const [multiple, setMultiple] = useState(false);
	const [search, setSearch] = useState('');
	const [mapInteracted, setMapInteracted] = useState(false);
	const [viewport, setViewport] = useState({ zoom: 3.5, center: [82, 22] });
	const [fitRequest, setFitRequest] = useState(0);
	const [notice, setNotice] = useState('');

	useEffect(() => {
		const controller = new AbortController();
		setLoadError('');
		setCollections({});
		setMapError('');
		setMapReady(false);
		(async () => {
			const config = await readJson('boundary-manifest.json', controller.signal);
			if (config.representation !== 'India')
				throw new Error('This workspace requires an India representation boundary manifest.');
			const initial = config.sources.filter((source) => ['country', 'state'].includes(source.id));
			if (initial.length !== 2)
				throw new Error('Country and state boundary sources must be configured.');
			const loaded = await Promise.all(
				initial.map(async (source) => [
					source.id,
					normalizeCollection(await readJson(source.url, controller.signal), source)
				])
			);
			if (controller.signal.aborted) return;
			setManifest(config);
			setCollections(Object.fromEntries(loaded));
		})().catch((error) => {
			if (error.name !== 'AbortError') setLoadError(error.message);
		});
		return () => controller.abort();
	}, [attempt]);

	useEffect(() => {
		const controller = new AbortController();
		setAccidentError('');
		readJson('accidents.json', controller.signal)
			.then((data) => {
				if (!controller.signal.aborted) setAccidentData(data);
			})
			.catch((error) => {
				if (error.name !== 'AbortError') setAccidentError(error.message);
			});
		return () => controller.abort();
	}, [accidentAttempt]);

	const districtSource = manifest?.sources.find((source) => source.id === 'district');
	useEffect(() => {
		if (level !== 'district' || !scopeState || !districtSource) {
			setDistrictLoading(false);
			return;
		}
		const controller = new AbortController();
		const url = districtSource.url.replace('{stateId}', encodeURIComponent(scopeState));
		setDistrictError('');
		setDistrictData(EMPTY_COLLECTION);
		if (districtCache.current.has(url)) {
			setDistrictData(districtCache.current.get(url));
			setDistrictLoading(false);
			return;
		}
		setDistrictLoading(true);
		readJson(url, controller.signal)
			.then((data) => {
				if (controller.signal.aborted) return;
				const normalized = normalizeCollection(data, districtSource);
				const filtered = {
					...normalized,
					features: normalized.features.filter(
						(feature) => String(feature.properties[districtSource.parentProperty]) === scopeState
					)
				};
				districtCache.current.set(url, filtered);
				setDistrictData(filtered);
				setDistrictLoading(false);
			})
			.catch((error) => {
				if (error.name !== 'AbortError') {
					setDistrictError(error.message);
					setDistrictLoading(false);
				}
			});
		return () => controller.abort();
	}, [level, scopeState, districtSource, districtAttempt]);

	const source = manifest?.sources.find((item) => item.id === (allIndia ? 'country' : level));
	const areas = level === 'district' ? districtData : (collections[level] ?? EMPTY_COLLECTION);
	const selection = useMemo(
		() =>
			allIndia ? (collections.country ?? EMPTY_COLLECTION) : selectFeatures(areas, selectedIds),
		[areas, selectedIds, allIndia, collections.country]
	);
	const states = useMemo(
		() =>
			[...(collections.state?.features ?? [])].sort((a, b) =>
				a.properties.aoi_name.localeCompare(b.properties.aoi_name)
			),
		[collections.state]
	);
	const visibleAreas = useMemo(
		() =>
			[...areas.features]
				.filter((feature) =>
					feature.properties.aoi_name.toLocaleLowerCase().includes(search.toLocaleLowerCase())
				)
				.sort((a, b) => a.properties.aoi_name.localeCompare(b.properties.aoi_name)),
		[areas, search]
	);
	useEffect(() => {
		if (mapReady && fitRequest > handledFitRequest.current) {
			handledFitRequest.current = fitRequest;
			if (selection.features.length) mapRef.current?.fit(selection);
			else mapRef.current?.home();
		}
	}, [fitRequest, selection, mapReady]);
	useEffect(() => {
		if (!notice) return;
		const timer = setTimeout(() => setNotice(''), 4000);
		return () => clearTimeout(timer);
	}, [notice]);

	function select(id) {
		setMapInteracted(true);
		setAllIndia(false);
		const removing = selectedIds.includes(id);
		setSelectedIds((current) =>
			multiple
				? current.includes(id)
					? current.filter((item) => item !== id)
					: [...current, id]
				: removing
					? []
					: [id]
		);
		setFitRequest((value) => value + 1);
	}
	function changeLevel(next) {
		if (!next) return;
		setAllIndia(false);
		if (next === level) return;
		if (next === 'district' && level === 'state' && selectedIds.length === 1)
			setScopeState(selectedIds[0]);
		setLevel(next);
		setSelectedIds([]);
		setSearch('');
		mapRef.current?.home();
	}
	function changeScope(id) {
		setAllIndia(false);
		setScopeState(id);
		setSelectedIds([]);
		setSearch('');
		const state = states.find((feature) => feature.id === id);
		if (state) mapRef.current?.fit(state);
	}
	function download() {
		const exported = exportSelection(selection, {
			level: allIndia ? 'country' : level,
			representation: manifest.representation,
			source
		});
		const url = URL.createObjectURL(
			new Blob([JSON.stringify(exported, null, 2)], { type: 'application/geo+json' })
		);
		const link = document.createElement('a');
		link.href = url;
		link.download = `india-${allIndia ? 'country' : level}-aoi.geojson`;
		link.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
		setNotice('GeoJSON exported with boundary source metadata.');
	}
	const loaded = !!collections.country && !!collections.state;
	const scopeName = states.find((feature) => feature.id === scopeState)?.properties.aoi_name;
	const listDescription =
		level === 'district'
			? scopeState
				? `${areas.features.length} districts in this snapshot`
				: 'Choose a state to explore its districts'
			: level === 'state'
				? `${areas.features.length} states and union territories`
				: 'Select the whole country';

	const nationalOverview = allIndia || (level === 'state' && !selectedIds.length);
	const summary = useMemo(
		() => accidentSummary(accidentData, selectedIds, year, nationalOverview),
		[accidentData, selectedIds, year, nationalOverview]
	);
	const accidentCollection = useMemo(
		() => accidentMapCollection(collections.state, accidentData, year),
		[collections.state, accidentData, year]
	);
	const overviewTitle = nationalOverview
		? 'All India overview'
		: level === 'district'
			? selection.features.length === 1
				? selection.features[0].properties.aoi_name
				: scopeName || 'District selection'
			: selection.features.length === 1
				? selection.features[0].properties.aoi_name
				: `${selection.features.length} states / UTs`;
	const unavailable =
		!allIndia && level === 'district' ? 'District accident totals are unavailable.' : null;
	function clearSelection() {
		setAllIndia(false);
		setLevel('state');
		setSelectedIds([]);
		setScopeState('');
		setSearch('');
		setMultiple(false);
		mapRef.current?.home();
	}
	function showAllIndia() {
		setAllIndia(true);
		setLevel('state');
		setSelectedIds([]);
		setSearch('');
		setMultiple(false);
		mapRef.current?.home();
	}

	return (
		<div className="app-shell">
			<header className="app-header">
				<a
					className="brand"
					href={import.meta.env.BASE_URL}
					aria-label="India Accident Analysis home"
				>
					<span className="brand-mark">
						<Icon name="layers" size={22} />
					</span>
					<span>
						India <span className="brand-light">Accident Analysis</span>
					</span>
				</a>
				<div className="header-description">Reported road accidents · 2018–2022</div>
			</header>
			<main className="workspace">
				<aside className="sidebar" aria-label="Area of interest selection">
					<div className="sidebar-top">
						<h1>Define your area</h1>
						<p className="intro">Choose an area of interest, on the map or from the list.</p>
					</div>
					<div className="selection-config">
						{enabledLevels.length > 1 && (
							<>
								<label className="field-label" id="level-label">
									Selection level
								</label>
								<ToggleGroup
									className="level-control"
									value={[level]}
									onValueChange={(values) => changeLevel(values[0])}
									aria-labelledby="level-label"
								>
									{Object.entries(levelLabels)
										.filter(([value]) => enabledLevels.includes(value))
										.map(([value, label]) => (
											<Toggle key={value} value={value}>
												{label === 'States & UTs' ? 'State / UT' : label}
											</Toggle>
										))}
								</ToggleGroup>
							</>
						)}

						<div className="mode-row">
							<span className="muted small">Selection mode</span>
							<ToggleGroup
								className="mode-control"
								value={[multiple ? 'multiple' : 'single']}
								onValueChange={(values) => {
									if (!values[0]) return;
									setMultiple(values[0] === 'multiple');
									if (values[0] === 'single') {
										setSelectedIds((ids) => ids.slice(0, 1));
										setFitRequest((value) => value + 1);
									}
								}}
								aria-label="Selection mode"
							>
								<Toggle value="single">Single</Toggle>
								<Toggle value="multiple">Multiple</Toggle>
							</ToggleGroup>
						</div>
						{level === 'district' && (
							<div className="scope-control">
								<label className="field-label">Within state or UT</label>
								<StateSelect states={states} value={scopeState} onChange={changeScope} />
							</div>
						)}
					</div>
					<section className="area-section" aria-label={levelLabels[level]}>
						<div className="search-field">
							<Icon name="search" size={17} />
							<Input
								aria-label={`Search ${levelLabels[level].toLowerCase()}`}
								placeholder={
									level === 'country'
										? 'Search country'
										: `Search ${level === 'state' ? 'states and UTs' : 'districts'}`
								}
								value={search}
								onChange={(event) => setSearch(event.target.value)}
							/>
							{search && (
								<button
									className="clear-search"
									aria-label="Clear search"
									onClick={() => setSearch('')}
								>
									<Icon name="close" size={14} />
								</button>
							)}
						</div>
						<p className="list-caption">{listDescription}</p>
						<div className="area-list">
							{!loaded && !loadError && (
								<div role="status" className="empty-state">
									<span className="loading-dot" />
									Loading boundaries…
								</div>
							)}
							{loadError && (
								<div role="alert" className="empty-state error-text">
									<p>{loadError}</p>
									<button
										className="button secondary"
										onClick={() => setAttempt((value) => value + 1)}
									>
										Retry loading
									</button>
								</div>
							)}
							{level === 'district' && !scopeState && (
								<div className="empty-state">
									<Icon name="layers" size={27} />
									<p>A closer view starts here.</p>
									<span className="small muted">Choose a state or union territory above.</span>
								</div>
							)}
							{districtLoading && level === 'district' && scopeState && (
								<div role="status" className="empty-state">
									Loading district boundaries…
								</div>
							)}
							{districtError && level === 'district' && (
								<div role="alert" className="empty-state error-text">
									<p>{districtError}</p>
									<button
										className="button secondary"
										onClick={() => setDistrictAttempt((value) => value + 1)}
									>
										Retry districts
									</button>
								</div>
							)}
							{loaded &&
								!(level === 'district' && districtLoading) &&
								visibleAreas.map((feature) => (
									<div
										className={`area-row ${selectedIds.includes(feature.id) ? 'selected' : ''}`}
										key={feature.id}
									>
										<label>
											<Checkbox.Root
												className="checkbox"
												checked={selectedIds.includes(feature.id)}
												onCheckedChange={() => select(feature.id)}
											>
												<Checkbox.Indicator>
													<Icon name="check" size={13} />
												</Checkbox.Indicator>
											</Checkbox.Root>
											<span>{feature.properties.aoi_name}</span>
										</label>
										<button
											className="row-fit"
											title={`Zoom to ${feature.properties.aoi_name}`}
											aria-label={`Zoom to ${feature.properties.aoi_name}`}
											disabled={!mapReady || !!mapError}
											onClick={() => mapRef.current?.fit(feature)}
										>
											<Icon name="extent" size={15} />
										</button>
									</div>
								))}
							{loaded &&
								!(level === 'district' && districtLoading) &&
								search &&
								!visibleAreas.length && (
									<div className="empty-state">
										<p>No areas match “{search}”.</p>
										<button className="text-button" onClick={() => setSearch('')}>
											Clear search
										</button>
									</div>
								)}
						</div>
						{level === 'district' && scopeState && (
							<p className="snapshot-note">
								{districtSource?.provenance.date ?? 'Supplied district snapshot'}.
							</p>
						)}
					</section>
					<section className="selection-summary" aria-label="Selected area">
						<div className="section-heading">
							<h2>Your selection</h2>
							{selection.features.length > 0 && (
								<div className="selection-actions">
									<button
										className="icon-button"
										aria-label="Fit selection to map"
										title="Fit selection to map"
										onClick={() => mapRef.current?.fit(selection)}
										disabled={!mapReady || !!mapError}
									>
										<Icon name="extent" size={16} />
									</button>
									<button className="text-button" onClick={clearSelection}>
										Clear
									</button>
								</div>
							)}
						</div>
						{selection.features.length ? (
							<>
								<div className="selection-title">
									<span className="selection-dot" />
									<strong>
										{selection.features.length === 1
											? selection.features[0].properties.aoi_name
											: `${selection.features.length} areas selected`}
									</strong>
								</div>
								{selection.features.length > 1 && (
									<p className="selection-names">
										{selection.features.map((feature) => feature.properties.aoi_name).join(', ')}
									</p>
								)}
								<div className="selection-accidents" aria-live="polite">
									<p className="selection-metric-label">Reported road accidents</p>
									<strong>
										{accidentError
											? 'Unavailable'
											: !accidentData
												? 'Loading…'
												: formatAccidents(summary?.total)}
									</strong>
									<span>Accidents in {year}</span>
									{summary?.note && <p className="small muted">{summary.note}</p>}
								</div>
							</>
						) : (
							<div className="unselected">
								<Icon name="cursor" size={21} />
								<p>
									No area selected<span>Choose a state to see its accidents.</span>
								</p>
							</div>
						)}
						<button
							className="button primary full-width export-button"
							disabled={!selection.features.length}
							onClick={download}
						>
							<Icon name="download" size={17} />
							Export GeoJSON
							<Icon name="arrow" size={16} />
						</button>
					</section>
					<div className="sidebar-footer">
						<SourceDialog manifest={manifest} />
						<span className="tiny-label">INDIA REPRESENTATION</span>
					</div>
				</aside>
				<div className="map-column">
					<section
						className="map-panel"
						aria-label="Interactive map workspace"
						onPointerDown={() => setMapInteracted(true)}
						onWheel={() => setMapInteracted(true)}
						onKeyDown={() => setMapInteracted(true)}
					>
						{loaded && (
							<MapView
								key={attempt}
								ref={mapRef}
								country={collections.country}
								activeCollection={areas}
								accidentCollection={accidentCollection}
								selection={allIndia ? EMPTY_COLLECTION : selection}
								onSelect={select}
								onViewport={setViewport}
								onError={setMapError}
								onReady={setMapReady}
							/>
						)}
						<div className="map-context">
							<span className="live-dot" />
							<button
								className="breadcrumb-button"
								onClick={showAllIndia}
								disabled={!loaded}
								title="All India overview"
							>
								India
							</button>
							<span className="context-divider">/</span>
							<span className="muted">{nationalOverview ? 'All India' : levelLabels[level]}</span>
							{scopeName && level === 'district' && (
								<>
									<span className="context-divider">/</span>
									<span>{scopeName}</span>
								</>
							)}
							<label className="year-control map-year-control">
								<span className="sr-only">Year</span>
								<select
									aria-label="Accident data year"
									value={year}
									onChange={(event) => setYear(Number(event.target.value))}
								>
									{(accidentData?.years ?? [2018, 2019, 2020, 2021, 2022]).map((value) => (
										<option key={value} value={value}>
											{value}
										</option>
									))}
								</select>
							</label>
						</div>
						{accidentData && (
							<div className="accident-legend">
								<strong>Road accidents · {year}</strong>
								<div>
									{ACCIDENT_COLORS.map((color) => (
										<span key={color} style={{ background: color }} />
									))}
								</div>
								<p>
									{['0', '500', '5k', '15k', '30k', '50k+'].map((label) => (
										<span key={label}>{label}</span>
									))}
								</p>
								<small>State / UT totals · gray = unavailable</small>
							</div>
						)}
						<div className="map-tools">
							<button
								className="icon-button"
								aria-label="Zoom in"
								title="Zoom in"
								onClick={() => mapRef.current?.zoom(1)}
								disabled={!mapReady || !!mapError}
							>
								<Icon name="plus" />
							</button>
							<button
								className="icon-button"
								aria-label="Zoom out"
								title="Zoom out"
								onClick={() => mapRef.current?.zoom(-1)}
								disabled={!mapReady || !!mapError}
							>
								<Icon name="minus" />
							</button>
							<span className="tool-divider" />
							<button
								className="icon-button"
								aria-label="Fit all India"
								title="Fit all India"
								onClick={showAllIndia}
								disabled={!mapReady || !!mapError}
							>
								<Icon name="home" />
							</button>
						</div>
						{(!loaded || mapError) && (
							<div className="map-message" role="status">
								<Icon name={mapError || loadError ? 'info' : 'layers'} size={30} />
								<h2>
									{mapError
										? 'Map unavailable'
										: loadError
											? 'Boundaries could not load'
											: 'Preparing your workspace'}
								</h2>
								<p>
									{mapError
										? `${mapError} You can still select and export from the area list.`
										: loadError
											? loadError
											: 'Loading India’s administrative boundaries.'}
								</p>
								{(mapError || loadError) && (
									<button
										className="button secondary"
										onClick={() => setAttempt((value) => value + 1)}
									>
										{mapError ? 'Reload map' : 'Retry loading'}
									</button>
								)}
							</div>
						)}
						{!mapInteracted && (
							<div className="map-hint">
								<Icon name="cursor" size={15} />
								<span>Click an area to select · Scroll to zoom</span>
							</div>
						)}
						<div className="map-status">
							<span className="coordinate-readout">
								{viewport.center[1].toFixed(2)}° N, {viewport.center[0].toFixed(2)}° E
							</span>
							<span className="zoom-readout">Z {viewport.zoom.toFixed(1)}</span>
						</div>
						<div className="map-credit">
							Boundaries:{' '}
							{manifest?.sources.find((source) => source.id === 'state')?.provenance.name ??
								'Indian government source'}{' '}
							· MapLibre
						</div>
					</section>
					<AccidentOverview
						data={accidentData}
						summary={summary}
						year={year}
						onYear={setYear}
						title={overviewTitle}
						unavailable={unavailable}
						error={accidentError}
						onRetry={() => setAccidentAttempt((value) => value + 1)}
						onState={
							level === 'district' && scopeState
								? () => {
										setAllIndia(false);
										setLevel('state');
										setSelectedIds([scopeState]);
										setSearch('');
										setFitRequest((value) => value + 1);
									}
								: null
						}
					/>
				</div>
			</main>
			<div className={`toast ${notice ? 'visible' : ''}`} role="status" aria-live="polite">
				{notice && (
					<>
						<Icon name="check" size={16} />
						{notice}
					</>
				)}
			</div>
		</div>
	);
}
