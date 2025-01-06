<script>
	import { writable } from 'svelte/store';
	export let selectedState = writable('');
	export let states = [];
</script>

<select on:change={(e) => selectedState.set(e.target.value)}>
	<option value="" disabled selected>Select a state</option>
	{#each states as state}
		<option value={state}>{state}</option>
	{/each}
</select>
