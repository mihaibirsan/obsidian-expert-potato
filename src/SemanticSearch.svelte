<script type="ts">
import { debounce } from "lodash";
import { plugin } from "./stores";

export let query = "";
let result = [];

const onQueryChange = debounce(async (e) => {
  query = e.target.value;
  result = await $plugin.service.search(query);
}, 500);
// TODO: Show "Loading..."
</script>

<h1>Semantic Search</h1>
<input type="text" bind:value={query} on:input={onQueryChange} placeholder="Search for a phrase..."/>

{#each result as { id, metadata: { text }, score }}
  <div>
    <p>{id}</p>
    <p>{text}</p>
    <p>{score}</p>
  </div>
{:else}
  <div>No results yet.</div>
{/each}
