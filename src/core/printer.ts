import EventEmitter from "node:events";
import path from "node:path";

import type { Browser } from "puppeteer";
import { PDFDocument } from "pdf-lib";
import puppeteer from "puppeteer";

import { getDirname } from "../utils";
import type { Page } from "../types";
import type { HtmlExportPdfOptions } from "../";
import { getOutline, setOutline } from "./outline";
import { setMetadata, setTrimBoxes } from "./postprocesser";

const scriptPath = path.resolve(getDirname(), "./paged.global.js");

interface Flow {
	performance: number
	width: number
	height: number
	total: number
	orientation: boolean
}

interface PrinterOptions {
	debug?: boolean
	headless?: boolean
	allowLocal?: boolean
	allowRemote?: boolean
	additionalScripts?: string[]
	allowedPaths?: string[]
	allowedDomains?: string[]
	ignoreHTTPSErrors?: boolean
	browserEndpoint?: string
	browserArgs?: string[]
	timeout?: number
	closeAfter?: boolean
	emulateMedia?: string
	styles?: string[]
	enableWarnings?: boolean
}
interface PrinterOptions {
	debug?: boolean
	headless?: boolean
	allowLocal?: boolean
	allowRemote?: boolean
	additionalScripts?: string[]
	allowedPaths?: string[]
	allowedDomains?: string[]
	ignoreHTTPSErrors?: boolean
	browserEndpoint?: string
	browserArgs?: string[]
	timeout?: number
	closeAfter?: boolean
	emulateMedia?: string
	styles?: string[]
	enableWarnings?: boolean
}

export class Printer extends EventEmitter {
	private debug: boolean;
	private headless: boolean;
	private allowLocal: boolean;
	private allowRemote: boolean;
	private additionalScripts: string[];
	private allowedPaths: string[];
	private allowedDomains: string[];
	private ignoreHTTPSErrors: boolean;
	private browserWSEndpoint?: string;
	private browserArgs: string[] | undefined;
	private timeout: number;
	private closeAfter: boolean;
	private emulateMedia: string;
	private styles: string[];
	private enableWarnings: boolean;
	private pages: Page[];
	private browser?: Browser;
	public content?: string;

	constructor(options: PrinterOptions = {}) {
		super();

		this.debug = options.debug ?? false;
		this.headless = options.headless !== false;
		this.allowLocal = options.allowLocal ?? false;
		this.allowRemote = options.allowRemote ?? true;
		this.additionalScripts = options.additionalScripts ?? [];
		this.allowedPaths = options.allowedPaths ?? [];
		this.allowedDomains = options.allowedDomains ?? [];
		this.ignoreHTTPSErrors = options.ignoreHTTPSErrors ?? false;
		this.browserWSEndpoint = options.browserEndpoint;
		this.browserArgs = options.browserArgs;
		this.timeout = options.timeout ?? 0;
		this.closeAfter = options.closeAfter ?? true;
		this.emulateMedia = options.emulateMedia ?? "print";
		this.styles = options.styles ?? [];
		this.enableWarnings = options.enableWarnings ?? false;

		this.pages = [];

		if (this.debug) {
			this.headless = false;
			this.closeAfter = false;
		}
	}

	async setup() {
		const puppeteerOptions = {
			headless: this.headless,
			args: ["--disable-dev-shm-usage", "--export-tagged-pdf"],
			ignoreHTTPSErrors: this.ignoreHTTPSErrors,
		};

		if (this.allowLocal)
			puppeteerOptions.args.push("--allow-file-access-from-files");

		if (this.browserArgs)
			puppeteerOptions.args.push(...this.browserArgs);

		if (this.browserWSEndpoint) {
			this.browser = await puppeteer.connect({
				...puppeteerOptions,
				browserWSEndpoint: this.browserWSEndpoint,
			});
		}
		else {
			this.browser = await puppeteer.launch(puppeteerOptions);
		}

		return this.browser;
	}

	async render(input: string) {
		let resolver: (value: unknown) => void;
		const rendered = new Promise((resolve) => {
			resolver = resolve;
		});

		if (!this.browser)
			await this.setup();

		try {
			const page = await this.browser!.newPage();
			page.setDefaultTimeout(this.timeout);
			await page.emulateMediaType(this.emulateMedia);

			if (this.needsAllowedRules()) {
				await page.setRequestInterception(true);

				page.on("request", (request) => {
					const uri = new URL(request.url());
					const { host, protocol, pathname } = uri;
					const local = protocol === "file:";

					if (local && !this.withinAllowedPath(pathname)) {
						request.abort();
						return;
					}

					if (local && !this.allowLocal) {
						request.abort();
						return;
					}

					if (host && !this.isAllowedDomain(host)) {
						request.abort();
						return;
					}

					if (host && !this.allowRemote) {
						request.abort();
						return;
					}

					request.continue();
				});
			}

			await page.goto(input, { waitUntil: "networkidle2" });
			this.content = await page.content();

			await page.evaluate(() => {
				window.PagedConfig = window.PagedConfig ?? {};
				window.PagedConfig.auto = false;
			});

			for (const style of this.styles) {
				await page.addStyleTag({
					path: style,
				});
			}

			await page.addScriptTag({
				path: scriptPath,
			});

			for (const script of this.additionalScripts) {
				await page.addScriptTag({
					path: script,
				});
			}

			await page.exposeFunction("onSize", (size: number) => {
				this.emit("size", size);
			});

			await page.exposeFunction("onPage", (page: Page) => {
				this.pages.push(page);

				this.emit("page", page);
			});

			await page.exposeFunction("onRendered", (msg: string, width: number, height: number, orientation: boolean) => {
				this.emit("rendered", msg, width, height, orientation);
				resolver({ msg, width, height, orientation });
			});

			await page.evaluate(async () => {
				// tsup.config.ts format IIFE
				const { previewer } = window.PagedPolyfill;
				previewer.on("page", (page) => {
					const { id, width, height, startToken, endToken, breakAfter, breakBefore, position } = page;

					const mediabox = page.element.getBoundingClientRect();
					const cropbox = page.pagebox.getBoundingClientRect();

					function getPointsValue(value: number) {
						// https://github.com/microsoft/TypeScript/issues/38554
						return (Math.round((CSS as any).px(value).to("pt").value * 100) / 100);
					}

					const boxes = {
						media: {
							width: getPointsValue(mediabox.width),
							height: getPointsValue(mediabox.height),
							x: 0,
							y: 0,
						},
						crop: {
							width: getPointsValue(cropbox.width),
							height: getPointsValue(cropbox.height),
							x: getPointsValue(cropbox.x) - getPointsValue(mediabox.x),
							y: getPointsValue(cropbox.y) - getPointsValue(mediabox.y),
						},
					};

					window.onPage({ id, width, height, startToken, endToken, breakAfter, breakBefore, position, boxes });
				});

				previewer.on("size", (size: number) => {
					window.onSize(size);
				});

				previewer.on("rendered", (flow: Flow) => {
					const msg = `Rendering ${flow.total} pages took ${flow.performance} milliseconds.`;
					window.onRendered(msg, flow.width, flow.height, flow.orientation);
				});

				if (window.PagedConfig.before)
					await window.PagedConfig.before();

				const done = await previewer.preview();

				if (window.PagedConfig.after)
					await window.PagedConfig.after(done);
			}).catch((error) => {
				throw error;
			});

			await page.waitForNetworkIdle({
				timeout: this.timeout,
			});

			await rendered;

			await page.waitForSelector(".pagedjs_pages");

			return page;
		}
		catch (error) {
			this.closeAfter && this.close();
			throw error;
		}
	}

	async pdf(input: string, options: HtmlExportPdfOptions) {
		const page = await this.render(input)
			.catch((e) => {
				throw e;
			});

		try {
			// Get metatags
			const meta = await page.evaluate(() => {
				const meta: any = {};
				const title = document.querySelector("title");
				if (title)
					meta.title = title.textContent!.trim();

				const lang = document.querySelector("html")?.getAttribute("lang");
				if (lang)
					meta.lang = lang;

				const metaTags = document.querySelectorAll("meta");
				[...metaTags].forEach((tag) => {
					if (tag.name)
						meta[tag.name] = tag.content;
				});
				return meta;
			});

			const outline = await getOutline(page, options.outlineTags);

			const pdf = await page.pdf({
				timeout: this.timeout,
				printBackground: true,
				displayHeaderFooter: false,
				preferCSSPageSize: !options.width,
				width: options.width,
				height: options.height,
				landscape: options.orientation,
				margin: {
					top: 0,
					right: 0,
					bottom: 0,
					left: 0,
				},
			})
				.catch((e) => {
					throw e;
				});

			this.closeAfter && page.close();

			this.emit("postprocessing");

			const pdfDoc = await PDFDocument.load(pdf);

			setMetadata(pdfDoc, meta);
			setTrimBoxes(pdfDoc, this.pages);
			setOutline(pdfDoc, outline, this.enableWarnings);

			return await pdfDoc.save();
		}
		catch (error) {
			this.closeAfter && this.close();
			throw error;
		}
	}

	async html(input: string) {
		const page = await this.render(input);

		const content = await page.content();

		if (this.closeAfter) {
			page.close();
			this.close();
		}

		return content;
	}

	async preview(input: string) {
		const page = await this.render(input);
		this.closeAfter && this.close();
		return page;
	}

	async close() {
		return this.browser && this.browser.close();
	}

	needsAllowedRules() {
		if (Array.isArray(this.allowedPaths) && this.allowedPaths.length)
			return true;

		if (Array.isArray(this.allowedDomains) && this.allowedDomains.length)
			return true;
		return false;
	}

	withinAllowedPath(pathname: string) {
		if (!this.allowedPaths || !this.allowedPaths.length)
			return true;

		for (const parent of this.allowedPaths) {
			const relative = path.relative(parent, pathname);
			if (relative && !relative.startsWith("..") && !path.isAbsolute(relative))
				return true;
		}

		return false;
	}

	isAllowedDomain(domain: string) {
		if (!this.allowedDomains || !this.allowedDomains.length)
			return true;
		return this.allowedDomains.includes(domain);
	}
}
