<script lang="ts">
	import { onMount } from 'svelte';

	// Confetti burst for the diploma (spec §8), drawn on a canvas for a few seconds.
	// Skipped for people who prefer reduced motion.
	const COLORS = ['#ff5a36', '#ffc233', '#22b35e', '#3a7bff', '#9b5cff', '#ff8a1f'];
	const DURATION = 4500;

	let canvas: HTMLCanvasElement | undefined = $state();

	onMount(() => {
		if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const context = canvas.getContext('2d');
		if (!context) return;

		const ratio = devicePixelRatio || 1;
		const width = innerWidth;
		const height = innerHeight;
		canvas.width = width * ratio;
		canvas.height = height * ratio;
		context.scale(ratio, ratio);

		const pieces = Array.from({ length: 160 }, (_, index) => ({
			x: width / 2 + (Math.random() - 0.5) * width * 0.3,
			y: height * 0.35,
			vx: (Math.random() - 0.5) * 14,
			vy: -Math.random() * 16 - 6,
			size: 6 + Math.random() * 6,
			angle: Math.random() * Math.PI,
			spin: (Math.random() - 0.5) * 0.4,
			color: COLORS[index % COLORS.length]
		}));

		const start = performance.now();
		let frame = requestAnimationFrame(function draw(now) {
			const elapsed = now - start;
			context.clearRect(0, 0, width, height);
			context.globalAlpha = Math.min(1, (DURATION - elapsed) / 800);
			for (const piece of pieces) {
				piece.vy += 0.35;
				piece.vx *= 0.99;
				piece.x += piece.vx;
				piece.y += piece.vy;
				piece.angle += piece.spin;
				context.save();
				context.translate(piece.x, piece.y);
				context.rotate(piece.angle);
				context.fillStyle = piece.color;
				context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
				context.restore();
			}
			if (elapsed < DURATION) frame = requestAnimationFrame(draw);
			else context.clearRect(0, 0, width, height);
		});

		return () => cancelAnimationFrame(frame);
	});
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
	canvas {
		position: fixed;
		inset: 0;
		z-index: 20;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
	}
</style>
