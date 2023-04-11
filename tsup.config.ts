import { defineConfig } from 'tsup'

export default defineConfig([
	{
		entry: ['src/*.ts', '!src/browser.ts'],
		dts: true,
		format: ['cjs', 'esm'],
		// legacyOutput: true,
		shims: true,
		clean: true,
	},
	{
		entry: ['src/browser.ts'],
		format: ['iife'],
		clean: true,
	},
])
