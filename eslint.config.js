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
			'no-undef': 'off'
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
		files: ['src/lib/core/**', 'src/lib/i18n/**'],
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
	{
		files: ['src/lib/core/**/*.svelte.ts', 'src/lib/i18n/**/*.svelte.ts'],
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
