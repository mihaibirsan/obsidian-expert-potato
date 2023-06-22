import type ExpertPotato from "main";
import { writable } from "svelte/store";

// TODO: This workaround might not be necessary in Svelte 4.
export const plugin = writable<ExpertPotato | null>(null);
