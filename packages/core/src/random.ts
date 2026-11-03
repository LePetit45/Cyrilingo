/** A source of random numbers in [0, 1), like Math.random. Injected so tests can use a seed. */
export type Random = () => number;

/** A seeded pseudo-random generator (mulberry32), for reproducible tests. */
export function seededRandom(seed: number): Random {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** A shuffled copy of the items (Fisher–Yates). */
export function shuffle<T>(items: readonly T[], random: Random): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

/** A random item, or undefined when there is none. */
export function pick<T>(items: readonly T[], random: Random): T | undefined {
	return items[Math.floor(random() * items.length)];
}
