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

<main>
	<h1>India Map</h1>
	<Dropdown {selectedState} {states} />
	<Map {selectedState} />
</main>
