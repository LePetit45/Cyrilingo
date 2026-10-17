<script lang="ts">
	import { m } from '#lib/i18n/index.js';

	// Lesson progress bar (spec §4.5): only moves forward on correct answers.
	let { value }: { value: number } = $props();
	const percent = $derived(Math.round(Math.min(1, Math.max(0, value)) * 100));
</script>

<div
	class="bar"
	role="progressbar"
	aria-label={m.session.progress}
	aria-valuemin={0}
	aria-valuemax={100}
	aria-valuenow={percent}
>
	<div class="fill" style:width="{percent}%"></div>
</div>

<style>
	.bar {
		flex: 1;
		height: 1.125rem;
		overflow: hidden;
		background: var(--color-border);
		border-radius: 999px;
	}

	.fill {
		height: 100%;
		min-width: 1.125rem;
		background: linear-gradient(to bottom, #4fd889, var(--color-success));
		border-radius: inherit;
		box-shadow: inset 0 -4px 0 rgb(0 0 0 / 0.12);
		transition: width 400ms cubic-bezier(0.3, 1.4, 0.6, 1);
	}
</style>
