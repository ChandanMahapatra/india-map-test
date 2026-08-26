<script lang="ts">
	import { base } from '$app/paths';
	import Map from '$lib/Map.svelte';
	import { onMount } from 'svelte';
	import Papa from 'papaparse';
	import { writable } from 'svelte/store';

	interface StateAccident {
		id: number;
		state_name: string;
		total_accidents_2022: number;
		rank_2022: number;
	}

	const selectedState = writable('');
	const accidentDataUrl = `${base}/total_accidents.csv`;

	let stateAccidents: StateAccident[] = [];
	let dataStatus: 'loading' | 'ready' | 'error' = 'loading';
	let mapRef: { resetMap: () => void } | undefined;

	function transformRow(row: Record<string, string | number>): StateAccident {
		return {
			id: Number(row.Sr_No),
			state_name: String(row.State_Name ?? '').trim(),
			total_accidents_2022: Number(String(row._2022 ?? '').replace(/[^\d.-]/g, '')),
			rank_2022: Number(row.rank_2022)
		};
	}

	onMount(() => {
		Papa.parse<Record<string, string | number>>(accidentDataUrl, {
			download: true,
			header: true,
			complete: (results) => {
				const parsed = results.data
					.map(transformRow)
					.filter(
						(item) =>
							item.state_name &&
							Number.isFinite(item.total_accidents_2022) &&
							Number.isFinite(item.rank_2022)
					);

				if (results.errors.length || !parsed.length) {
					console.error('Unable to parse accident data:', results.errors);
					dataStatus = 'error';
					return;
				}

				stateAccidents = parsed;
				dataStatus = 'ready';
			},
			error: (error) => {
				console.error('Unable to load accident data:', error);
				dataStatus = 'error';
			}
		});
	});

	function resetMapView(): void {
		mapRef?.resetMap();
	}
</script>

<svelte:head>
	<title>India Road Accidents Map</title>
	<meta
		name="description"
		content="Explore reported road accidents across Indian states and union territories in 2022."
	/>
</svelte:head>

<div class="app-shell">
	<header class="header">
		<div class="heading">
			<p class="eyebrow">India · 2022</p>
			<h1>Road Accidents Map</h1>
		</div>

		<div class="controls">
			<label class="state-control" for="state-select">
				<span>State or union territory</span>
				<select
					id="state-select"
					bind:value={$selectedState}
					disabled={dataStatus !== 'ready'}
					aria-describedby="data-status"
				>
					<option value="">All India</option>
					{#each stateAccidents as accident}
						<option value={accident.state_name}>{accident.state_name}</option>
					{/each}
				</select>
			</label>

			<button type="button" class="reset-button" onclick={resetMapView} disabled={!$selectedState}>
				Reset view
			</button>

			<a
				href="https://github.com/ChandanMahapatra/india-map-test"
				target="_blank"
				rel="noopener noreferrer"
				class="source-link"
			>
				Source
				<span aria-hidden="true">↗</span>
			</a>
		</div>

		<p id="data-status" class="sr-only" aria-live="polite">
			{dataStatus === 'loading'
				? 'Loading accident data'
				: dataStatus === 'error'
					? 'Accident data could not be loaded'
					: `${stateAccidents.length} state and union territory records loaded`}
		</p>
	</header>

	<main class="map-panel">
		<Map bind:this={mapRef} {selectedState} {stateAccidents} />

		{#if dataStatus === 'error'}
			<div class="data-warning" role="alert">
				<strong>Accident figures are unavailable.</strong>
				<span>The state boundaries can still be explored.</span>
			</div>
		{/if}
	</main>
</div>

<style>
	.app-shell {
		display: flex;
		width: 100%;
		min-height: 100vh;
		min-height: 100dvh;
		flex-direction: column;
		overflow: hidden;
		background: #edf3f7;
	}

	.header {
		position: relative;
		z-index: 10;
		display: flex;
		min-height: 72px;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		background: #12212b;
		padding: 12px clamp(16px, 3vw, 36px);
		color: #f8fafc;
		box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
	}

	.heading {
		min-width: max-content;
	}

	.eyebrow {
		margin: 0 0 1px;
		color: #93c5fd;
		font-size: 0.66rem;
		font-weight: 750;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-size: clamp(1.05rem, 2vw, 1.35rem);
		font-weight: 680;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.controls {
		display: flex;
		align-items: flex-end;
		gap: 9px;
	}

	.state-control {
		display: grid;
		gap: 3px;
		color: #b8c5cf;
		font-size: 0.65rem;
		font-weight: 650;
		letter-spacing: 0.02em;
	}

	select,
	.reset-button,
	.source-link {
		height: 38px;
		border-radius: 8px;
		font-size: 0.82rem;
		font-weight: 620;
	}

	select {
		min-width: 210px;
		border: 1px solid #536572;
		background: #21333f;
		padding: 0 34px 0 11px;
		color: #f8fafc;
		cursor: pointer;
	}

	select:disabled {
		cursor: wait;
		opacity: 0.65;
	}

	.reset-button,
	.source-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #536572;
		background: transparent;
		padding: 0 13px;
		color: #f8fafc;
		text-decoration: none;
		cursor: pointer;
		transition:
			border-color 150ms ease,
			background 150ms ease;
	}

	.source-link {
		gap: 5px;
	}

	.reset-button:hover:not(:disabled),
	.source-link:hover {
		border-color: #93c5fd;
		background: #21333f;
	}

	.reset-button:disabled {
		cursor: default;
		opacity: 0.42;
	}

	.map-panel {
		position: relative;
		min-height: 0;
		flex: 1;
		overflow: hidden;
	}

	.data-warning {
		position: absolute;
		left: 50%;
		top: 16px;
		z-index: 8;
		display: flex;
		max-width: calc(100% - 32px);
		transform: translateX(-50%);
		gap: 8px;
		border: 1px solid #fed7aa;
		border-radius: 10px;
		background: #fff7ed;
		padding: 10px 14px;
		color: #9a3412;
		font-size: 0.8rem;
		box-shadow: 0 8px 20px rgba(124, 45, 18, 0.1);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (max-width: 760px) {
		.header {
			min-height: 124px;
			align-items: stretch;
			flex-direction: column;
			justify-content: center;
			gap: 10px;
			padding-block: 12px;
		}

		.heading {
			min-width: 0;
		}

		.controls {
			align-items: center;
		}

		.state-control {
			flex: 1;
		}

		.state-control > span {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
		}

		select {
			width: 100%;
			min-width: 0;
		}

		.source-link {
			width: 40px;
			padding: 0;
			font-size: 0;
		}

		.source-link span {
			font-size: 1rem;
		}

		.data-warning {
			align-items: flex-start;
			flex-direction: column;
			gap: 1px;
		}
	}

	@media (max-width: 420px) {
		.reset-button {
			padding-inline: 10px;
			font-size: 0.75rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.reset-button,
		.source-link {
			transition: none;
		}
	}
</style>
