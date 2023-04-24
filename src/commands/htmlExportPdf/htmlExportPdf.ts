import path from "node:path";
import { accessSync, constants } from "node:fs";

import { dim, green, red } from "colorette";
import type { PaperFormat } from "puppeteer";
import fg from "fast-glob";

import { createProgress, isValidUrl, replaceExt, writeFileSafe } from "../../utils";
import { Printer } from "../../";

export interface HtmlExportPdfOptions {
	inputs: string[]
	outlineTags: string[]
	outFile: string
	outDir?: string
	debug?: boolean
	scale?: number
	headerTemplate?: string
	footerTemplate?: string
	preferCSSPageSize?: boolean
	printBackground?: boolean
	omitBackground?: boolean
	pageRanges?: string
	margin?: string
	landscape?: boolean
	pageSize?: PaperFormat
	width?: number | string
	height?: number | string
	timeout?: number
	html?: boolean
	blockLocal?: boolean
	blockRemote?: boolean
	allowedPaths?: string[]
	allowedDomains?: string[]
	ignoreHTTPSErrors?: boolean
	additionalScripts?: string[]
	additionalStyles?: string[]
	browserEndpoint?: string
	browserArgs?: string[]
	media?: string
	warn?: boolean
}

export async function htmlExportPdf(args: undefined | string[], options: HtmlExportPdfOptions) {
	const inputArr = options.inputs.length ? options.inputs : (args ?? []);

	if (!inputArr.length) {
		red("You must include an input path");
		process.exit(1);
	}

	const dir = process.cwd();

	const globPaths = inputArr.reduce<string[]>((acc, inputPath) => {
		if (!isValidUrl(inputPath)) {
			if (![".htm", ".html", ".xhtml"].includes(path.extname(inputPath))) {
				red(`${inputPath} is must a html or xhtml file`);
				process.exit(1);
			}
			try {
				accessSync(inputPath, constants.F_OK);
			}
			catch (e) {
				console.error(`${inputPath} Input cannot be found`, e);
				process.exit(1);
			}
			const absolutePathArr = fg.sync([inputPath], {
				ignore: ["node_modules"],
				onlyFiles: true,
				cwd: dir,
				absolute: true,
			});
			return [...acc, ...absolutePathArr.map(item => `file://${item}`)];
		}
		return [...acc, inputPath];
	}, []);

	const isSingleFile = globPaths.length === 1;
	const progress = createProgress(isSingleFile);
	progress.start(globPaths.length);

	const printerOptions = {
		debug: options.debug,
		headless: true,
		allowLocal: !options.blockLocal,
		allowRemote: !options.blockRemote,
		allowedPaths: options.allowedPaths,
		allowedDomains: options.allowedDomains,
		ignoreHTTPSErrors: options.ignoreHTTPSErrors,
		additionalScripts: options.additionalScripts,
		additionalStyles: options.additionalStyles,
		browserEndpoint: options.browserEndpoint,
		timeout: options.timeout,
		browserArgs: options.browserArgs,
		emulateMedia: options.media,
		enableWarnings: options.warn,
	};

	const printer = new Printer(printerOptions);

	const getOutFileName = (inputPath: string) => {
		if (globPaths.length === 1 && options.outFile)
			return options.outFile!.endsWith(".pdf") ? options.outFile! : `${options.outFile}.pdf`;

		const baseName = path.basename(inputPath);
		const splitBaseName = baseName.split(":")[0];
		const hostName = new URL(inputPath).hostname;
		if (splitBaseName === hostName) {
			/**
			 * @example https://www.example.com/ www.example.com.pdf
			*/
			return `${hostName}.pdf`;
		}

		const filename = baseName.split("/").pop();
		if (!filename?.length)
			return `${baseName.split("/").filter(Boolean).join("_")}.pdf`;

		return replaceExt(path.basename(inputPath), ".pdf");
	};

	const promises = globPaths.map(async (inputPath: string) => {
		const outFileName = getOutFileName(inputPath);
		let output = path.join(dir, options.outDir ?? "", outFileName);

		let file;
		if (options.html) {
			file = await printer.html(inputPath)
				.catch((e: ErrorOptions) => {
					console.error(e);
					process.exit(1);
				});
			output = replaceExt(output, ".html");
		}
		else if (options.debug === true) {
			await printer.preview(inputPath);
		}
		else {
			file = await printer.pdf(inputPath, options)
				.catch((e: ErrorOptions) => {
					console.error(e);
					process.exit(1);
				});
		}

		if (file && output) {
			const isWrite = await writeFileSafe(output, file);
			if (isWrite) {
				progress.increment(1);
				isSingleFile && process.stdout.write(`\n\n ${green("  ✓ ")}${dim("Saved to ")} ${output}\n\n`);
			}
			else { process.exit(1); }
		}
		else if (file) {
			process.stdout.write(file);
		}
		return true;
	});

	await Promise.all(promises);
	await printer.close();
	progress.stop();
	process.exit(0);
}

export default htmlExportPdf;
