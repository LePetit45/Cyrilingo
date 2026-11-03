import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',
			// French UI strings use no-break spaces before : ! ? (also in template literals).
			'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true }]
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},
	{
		// Business logic and string catalogs are plain TypeScript with no dependency on Svelte
		// or SvelteKit, so the UI framework can be swapped later (spec §10, Architecture).
		files: ['packages/core/**', 'apps/web/src/lib/i18n/**'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['svelte', 'svelte/*', '@sveltejs/*', '$app/*', '$env/*', '*.svelte'],
							message: 'core and i18n modules must not depend on Svelte or SvelteKit.'
						},
						{
							group: ['#lib/ui', '#lib/ui/*', '**/ui/*'],
							message: 'core and i18n modules must not import UI components.'
						}
					]
				}
			]
		}
	},
	// API layers (AGENTS.md › Layers): http and mcp → services → db, auth, speech.
	{
		files: ['apps/api/src/http/**', 'apps/api/src/mcp/**'],
		ignores: ['**/*.test.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['**/db/*', '**/auth/*', '**/speech/*', 'pg', 'kysely'],
							message: 'Routes and MCP tools call a service, never the database or a provider.'
						}
					]
				}
			]
		}
	},
	{
		files: ['apps/api/src/services/**'],
		ignores: ['**/*.test.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['**/http/*', '**/mcp/*', 'hono', 'hono/*', '@hono/*'],
							message: 'Services never see HTTP or MCP.'
						},
						{
							group: ['pg', 'kysely'],
							message: 'Queries live in apps/api/src/db/.'
						}
					]
				}
			]
		}
	},
	{
		files: ['apps/api/src/db/**', 'apps/api/src/auth/**', 'apps/api/src/speech/**'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['**/http/*', '**/mcp/*', '**/services/*', 'hono', 'hono/*', '@hono/*'],
							message: 'The lowest layer imports no layer above it.'
						}
					]
				}
			]
		}
	},
	{
		files: ['packages/core/**/*.svelte.ts', 'apps/web/src/lib/i18n/**/*.svelte.ts'],
		rules: {
			'no-restricted-syntax': [
				'error',
				{
					selector: 'Program',
					message: 'Rune modules (.svelte.ts) are not allowed in core or i18n.'
				}
			]
		}
	}
);
