<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.js';
	import Button from './Button.svelte';

	// What a guest sees in place of a feature that needs an account: why to sign in, and the way.
	let { message }: { message: string } = $props();
</script>

<div class="invite">
	<p>{message}</p>
	<div class="actions">
		<Button href={resolve('/(tabs)/signin')} wide>{m.account.signIn}</Button>
		<Button href={resolve('/(tabs)/signup')} variant="secondary" wide>{m.account.signUp}</Button>
	</div>
</div>

<style>
	.invite {
		display: grid;
		gap: 1rem;
		padding: 1.25rem;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	p {
		margin: 0;
		font-weight: 700;
	}

	.actions {
		display: grid;
		gap: 0.75rem;
	}
</style>
