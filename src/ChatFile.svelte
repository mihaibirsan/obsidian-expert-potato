<script type="ts">
import { requestUrl } from "obsidian";
import { writable } from "svelte/store";
import { plugin } from "./stores";
export let data = writable("");

$: parsed = $data ? JSON.parse($data) : { messages: [] };

let inputEl;

const onSubmit = async (event) => {
    event.preventDefault();
    parsed.messages.push({ role: "user", content: inputEl.value });
    parsed = parsed;
    inputEl.value = "";
    inputEl.disabled = true;

    const request = {
        url: "https://api.openai.com/v1/chat/completions",
        method: "POST",
        body: JSON.stringify(parsed),
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + $plugin?.settings?.openAiApiKey,
        },
    }
    console.log(request)
    const response = await requestUrl(request).json
    console.log(response)

    parsed.messages.push(response.choices[0].message);
    inputEl.disabled = false;
    inputEl.focus();
    $data = JSON.stringify(parsed, null, 2);
};

</script>

{#each parsed.messages as {role, content}}
<p class="chat-message chat-message-role-{role}"><span class="chat-role">{role}</span> {content}</p>
{/each}

<form on:submit={onSubmit}>
  <input type="text" bind:this={inputEl} />
  <button>Send</button>
</form>
