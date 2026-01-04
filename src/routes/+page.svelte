<script lang="ts">
	import { onMount } from 'svelte';
	import Map from '$lib/Map.svelte';
	import { writable } from 'svelte/store';
	import Papa from 'papaparse';

	const allStateAccidentsDataUrl =
		import.meta.env.MODE === 'development'
			? '/total_accidents.csv'
			: 'https://raw.githubusercontent.com/ChandanMahapatra/india-map-test/refs/heads/master/static/total_accidents.csv';

	const selectedState = writable('');
	export let stateAccidents: any[] = [];
	let mapRef: any;

	interface StateAccident {
		id: number;
		state_name: string;
		total_accidents_2022: number;
		rank_2022: number;
	}

	function transformRow(row: any): StateAccident {
		return {
			id: row.Sr_No,
			state_name: row.State_Name,
			total_accidents_2022: parseInt(String(row._2022).replace(/,/g, ''), 10),
			rank_2022: row.rank_2022
		};
	}

	onMount(() => {
		try {
			Papa.parse(allStateAccidentsDataUrl, {
				download: true,
				header: true,
				dynamicTyping: true,
				complete: function (results: any) {
					stateAccidents = results.data.map(transformRow);
					console.log(stateAccidents);
				}
			});
		} catch (error) {
			console.error('Error:', error);
		}
	});

	function resetMapView() {
		mapRef?.resetMap();
	}

	function handleStateChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		if (target.value) {
			selectedState.set(target.value);
		}
	}
</script>

<div class="app">
	<header class="header">
		<h1 class="title">India Road Accidents Map</h1>
		<div class="controls">
			<div class="select-wrapper">
				<label class="select-label" for="state-select">Select State</label>
				<select
					id="state-select"
					class="select"
					onchange={handleStateChange}
					aria-label="Select a state to view accident statistics"
				>
					<option value="">Select a state</option>
					{#each stateAccidents as accident}
						<option value={accident.state_name}>{accident.state_name}</option>
					{/each}
				</select>
			</div>

			<button class="home-button" onclick={resetMapView}> Home </button>

			<a
				href="https://github.com/ChandanMahapatra/india-map-test"
				target="_blank"
				rel="noopener noreferrer"
				class="github-link"
				aria-label="View source code on GitHub"
			>
				<svg height="20" viewBox="0 0 16 16" width="20" fill="currentColor">
					<path
						d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
					/>
				</svg>
			</a>
		</div>
	</header>

	<main class="main">
		<Map bind:this={mapRef} {selectedState} {stateAccidents} />
	</main>
</div>

<style>
	:global(body) {
		margin: 0px;
		padding: 0px;
	}

	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		margin: 0px;
		padding: 0px;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: #1f2937;
		color: white;
		height: 64px;
		flex-shrink: 0;
		margin: 0px;
	}

	.title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: nowrap;
	}

	.select-label {
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

	.select-wrapper {
		position: relative;
	}

	.select {
		background: #374151;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		border: none;
		cursor: pointer;
		font-size: 0.875rem;
		min-width: 180px;
	}

	.select:focus {
		outline: none;
		box-shadow: 0 0 0 2px #3b82f6;
	}

	.home-button {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		border: none;
		cursor: pointer;
		font-weight: 500;
		font-size: 0.875rem;
		transition: background-color 0.2s;
		background: #3b82f6;
		color: white;
	}

	.home-button:hover {
		background: #2563eb;
	}

	.home-button:focus {
		outline: none;
		box-shadow: 0 0 0 2px #60a5fa;
	}

	.github-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 0.375rem;
		background: #374151;
		color: white;
		transition: background-color 0.2s;
		text-decoration: none;
	}

	.github-link:hover {
		background: #4b5563;
	}

	.main {
		flex: 1;
		position: relative;
		overflow: hidden;
		width: 100%;
		margin: 0px;
		padding: 0px;
	}
</style>
