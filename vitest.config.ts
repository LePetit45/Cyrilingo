import { defineConfig } from 'vitest/config';

// One Vitest run over every workspace; each one keeps its own config.
export default defineConfig({
	test: {
		projects: ['packages/core', 'apps/web']
	}
});
