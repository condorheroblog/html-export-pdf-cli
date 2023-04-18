import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/**/*.ts", "!src/browser/*.ts"],
		dts: true,
		format: ["esm", "cjs"],
		// legacyOutput: true,
		shims: true,
		clean: true,
	},
	{
		entry: ["src/browser/*.ts"],
		format: ["iife"],
		platform: "browser",
		globalName: "PagedPolyfill",
		clean: true,
	},
]);
