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
		position: relative;
		height: 100%;
		min-width: 1.125rem;
		background: var(--color-success);
		border-radius: inherit;
		transition: width 400ms cubic-bezier(0.3, 1.4, 0.6, 1);
	}

	/* Light streak along the top, for a glossy, chunky look. */
	.fill::after {
		content: '';
		position: absolute;
		top: 0.25rem;
		right: 0.5rem;
		left: 0.5rem;
		height: 0.25rem;
		background: rgb(255 255 255 / 0.3);
		border-radius: inherit;
	}
</style>
