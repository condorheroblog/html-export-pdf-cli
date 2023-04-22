import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/**/*.ts"],
	dts: true,
	format: ["esm", "cjs"],
	// legacyOutput: true,
	shims: true,
	clean: true,
});
