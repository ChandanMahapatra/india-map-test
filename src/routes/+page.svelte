<script lang="ts">
	import { onMount } from 'svelte';
	import Map from '$lib/Map.svelte';
	import Dropdown from '$lib/Dropdown.svelte';
	import { writable } from 'svelte/store';
	import Papa from 'papaparse';
	import '../app.css';

	const allStateAccidentsDataUrl = 
				import.meta.env.MODE === 'development'
				? '/total_accidents.csv'
				: 'https://raw.githubusercontent.com/ChandanMahapatra/india-map-test/refs/heads/master/static/total_accidents.csv';
	
	const selectedState = writable('');
	export let stateAccidents: [];
	let mapRef;
	
	interface stateAccident {
		id: int; 
		state_name: string; 
		total_accidents_2018: int;
		total_accidents_2019: int;
		total_accidents_2020: int;
		total_accidents_2021: int;
		total_accidents_2022: int;
		abs_change_in_2022: int;
		rel_change_in_2022: int;
		rank_2018: int;
		rank_2019: int;
		rank_2020: int;
		rank_2021: int;
		rank_2022: int;
	};

	function transformRow(row: any) : stateAccident {
		return {
			id: row.Sr_No,
			state_name: row.State_Name,
			total_accidents_2018: parseInt(row._2018),
			total_accidents_2019: row._2019,
			total_accidents_2020: row._2020,
			total_accidents_2021: row._2021,
			total_accidents_2022: parseInt(String(row._2022).replace(/,/g, ''),10),
			abs_change_in_2022: row.Absolute_Change_in_2022_over_2021,
			rel_change_in_2022: row.percent_change_in_2022_over_2021,
			rank_2018: row.rank_2018,
			rank_2019: row.rank_2019,
			rank_2020: row.rank_2020,
			rank_2021: row.rank_2021,
			rank_2022: row.rank_2022
		};
	}

	onMount(() => {
		try {
			Papa.parse(allStateAccidentsDataUrl, {
				download: true,
				header: true,
				dynamicTyping: true,
				complete: function(results) { 
					stateAccidents = results.data.map(transformRow);
					console.log(stateAccidents);
				}
			});
		}
		catch (error) { 
			console.error('Error:', error); 
		}
	});

	// Use mapRef to call the resetMap method from the Map component
	function resetMapView() {
		mapRef?.resetMap();
	}
</script>

<div class="flex flex-col h-screen">
	<!-- Header -->
	<header class="bg-gray-800 text-white p-4 flex items-center justify-between">
		<h1 class="text-xl font-bold">India Road Accidents Map</h1>
		<div class="flex gap-4">
			<Dropdown {selectedState} {stateAccidents} />
			<button
				on:click={resetMapView}
				class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
			>
				Home
			</button>
		</div>
	</header>

	<!-- Map Section -->
	<main class="flex-grow">
		<Map bind:this={mapRef} {selectedState} { stateAccidents } />
	</main>
</div>
