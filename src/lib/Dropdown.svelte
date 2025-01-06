<script>
	export let selectedState;
	export let states = [];
</script>

<select
	class="bg-gray-700 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
	on:change={(e) => selectedState.set(e.target.value)}
>
	<option value="" disabled selected>Select a state</option>
	{#each states as state}
		<option value={state}>{state}</option>
	{/each}
</select>
