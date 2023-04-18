import path from "node:path";
import { accessSync, constants } from "node:fs";

import { dim, green, red } from "colorette";
import fg from "fast-glob";

import { createProgress, isValidUrl, replaceExt, writeFileSafe } from "../../utils";
import { Printer } from "../../";

export interface HtmlExportPdfOptions {
	inputs: string[]
	landscape: boolean
	blockLocal: boolean
	html: boolean
	allowedPath: []
	allowedDomain: []
	outlineTags: string[]
	additionalScript: []
	styles: string[]
	outFile?: string
	outDir?: string
	debug: boolean
	headless: boolean
	blockRemote: boolean
	allowRemote: boolean
	allowedPaths: string[]
	allowedDomains: string[]
	additionalScripts: string[]
	browserEndpoint: string
	timeout: number
	browserArgs: string[]
	media: string
	warn: boolean
	width?: number
	height?: number
	orientation?: boolean
}

export async function htmlExportPdf(args: undefined | string[], options: HtmlExportPdfOptions) {
	const inputArr = options.inputs.length ? options.inputs : (args ?? []);

	if (!inputArr.length) {
		red("You must include an input path");
		process.exit(1);
	}

	const dir = process.cwd();

	const globPaths = fg.sync(inputArr, {
		ignore: ["node_modules"],
		onlyFiles: true,
		cwd: dir,
		absolute: true,
	});

	globPaths.forEach((absoluteInputPath: string, inputIndex: number) => {
		if (![".htm", ".html", ".xhtml"].includes(path.extname(absoluteInputPath))) {
			red(`${absoluteInputPath} is must a html or xhtml file`);
			process.exit(1);
		}

		if (!isValidUrl(absoluteInputPath)) {
			try {
				accessSync(absoluteInputPath, constants.F_OK);
			}
			catch (e) {
				console.error(`${absoluteInputPath} Input cannot be found`, e);
				process.exit(1);
			}

			globPaths[inputIndex] = `file://${absoluteInputPath}`;
		}
	});

	const isSingleFile = globPaths.length === 1;
	const progress = createProgress(isSingleFile);
	progress.start(globPaths.length);

	const printerOptions = {
		debug: options.debug,
		headless: options.headless,
		allowLocal: !options.blockLocal,
		allowRemote: !options.blockRemote,
		allowedPaths: options.allowedPaths,
		allowedDomains: options.allowedDomains,
		additionalScripts: options.additionalScript,
		styles: options.styles,
		browserEndpoint: options.browserEndpoint,
		timeout: options.timeout,
		browserArgs: options.browserArgs,
		emulateMedia: options.media,
		enableWarnings: options.warn,
	};

	const printer = new Printer(printerOptions);
	if (isSingleFile) {
		printer.on("page", (page) => {
			if (page.position === 0) {
				progress.updateText("Loaded");
				progress.updateText(`Rendering: Page ${page.position + 1}`);
			}
			else {
				progress.updateText(`Rendering: Page ${page.position + 1}`);
			}
		});

		printer.on("rendered", (msg) => {
			progress.updateText(msg);
			progress.updateText("Generating");
		});

		printer.on("postprocessing", () => {
			progress.updateText("Generated");
			progress.updateText("Processing");
		});
	}

	const promises = globPaths.map(async (inputPath: string) => {
		const getOutFile = () => options.outFile!.endsWith(".pdf") ? options.outFile! : `${options.outFile}.pdf`;
		const outFileName = (globPaths.length === 1 && options.outFile) ? getOutFile() : replaceExt(path.basename(inputPath), ".pdf");
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

		isSingleFile && progress.updateText("Processed");

		if (file && output) {
			const isWrite = await writeFileSafe(output, file);
			if (isWrite) {
				progress.updateNumber(1);
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
	progress.stop();
	process.exit(0);
}

export default htmlExportPdf;
