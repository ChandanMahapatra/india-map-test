<script>
	import Map from '$lib/Map.svelte';
	import Dropdown from '$lib/Dropdown.svelte';
	import { writable } from 'svelte/store';

	const selectedState = writable('');
	const states = [
		'Andhra Pradesh',
		'Arunachal Pradesh',
		'Assam',
		'Bihar',
		'Chhattisgarh',
		'Goa',
		'Gujarat',
		'Haryana',
		'Himachal Pradesh',
		'Jharkhand',
		'Karnataka',
		'Kerala',
		'Madhya Pradesh',
		'Maharashtra',
		'Manipur',
		'Meghalaya',
		'Mizoram',
		'Nagaland',
		'Odisha',
		'Punjab',
		'Rajasthan',
		'Sikkim',
		'Tamil Nadu',
		'Telangana',
		'Tripura',
		'Uttar Pradesh',
		'Uttarakhand',
		'West Bengal'
	];
</script>

<div class="flex flex-col h-screen">
	<!-- Header -->
	<header class="bg-gray-800 text-white p-4 flex items-center justify-between">
		<h1 class="text-xl font-bold">India Map</h1>
		<div class="flex gap-4">
			<Dropdown {selectedState} {states} />
			<button
				on:click={() => selectedState.set('')}
				class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
			>
				Home
			</button>
		</div>
	</header>

	<!-- Map Section -->
	<main class="">
		<Map {selectedState} />
	</main>
</div>
