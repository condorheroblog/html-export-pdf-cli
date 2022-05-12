import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import license from "rollup-plugin-license";

const plugins = [
	nodeResolve({
		extensions: ['.cjs','.mjs', '.js']
	}),
	commonjs({
		include: ["node_modules/**", "../../node_modules/**"]
	}),
	json(),
	license({
		banner: "@license Paged.js v<%= pkg.version %> | MIT | https://pagedjs.org",
	})
];

export default [
	{
		input: "./src/browser.js",
		output: {
			name: "PagedPolyfill",
			file: "./dist/browser.js",
			format: "umd"
		},
		plugins: plugins
	}
];
