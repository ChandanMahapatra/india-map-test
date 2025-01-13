<script>
	export let selectedState;
	export let stateAccidents;
</script>

<select
	class="bg-gray-700 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
	on:change={(e) => selectedState.set(e.target.value)}
>
	<option value="" disabled selected>Select a state</option>
	{#each stateAccidents as stateAccident}
		<option value={stateAccident.state_name}>{stateAccident.state_name}</option>
	{/each}
</select>
