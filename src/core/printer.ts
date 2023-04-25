import EventEmitter from "node:events";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import puppeteer from "puppeteer";
import type { Browser, LaunchOptions, PDFOptions, Page } from "puppeteer";
import { getOutline, setOutline } from "./outline";
import { setMetadata } from "./postprocesser";

export type { Browser, PDFOptions, Page, LaunchOptions };

export interface PrinterOptions {
	debug?: boolean
	headless?: boolean
	allowLocal?: boolean
	allowRemote?: boolean
	outlineTags?: string[]
	additionalScripts?: string[]
	allowedPaths?: string[]
	allowedDomains?: string[]
	ignoreHTTPSErrors?: boolean
	browserEndpoint?: string
	browserArgs?: string[]
	timeout?: number
	closeAfter?: boolean
	emulateMedia?: string
	additionalStyles?: string[]
	enableWarnings?: boolean
}

export class Printer extends EventEmitter {
	private debug: boolean;
	private headless: boolean;
	private allowLocal: boolean;
	private outlineTags: string[];
	private allowRemote: boolean;
	private additionalScripts: string[];
	private allowedPaths: string[];
	private allowedDomains: string[];
	private ignoreHTTPSErrors: boolean;
	private browserWSEndpoint?: string;
	private browserArgs: string[];
	private timeout: number;
	private closeAfter: boolean;
	private emulateMedia: string;
	private additionalStyles: string[];
	private enableWarnings: boolean;
	private pages: Map<string, Page>;
	private browser?: Browser;
	public content?: string;

	constructor(options: PrinterOptions = {}) {
		super();

		this.debug = options.debug ?? false;
		this.headless = options.headless !== false;
		this.allowLocal = options.allowLocal ?? false;
		this.allowRemote = options.allowRemote ?? true;
		this.outlineTags = options.outlineTags ?? ["h1", "h2", "h3", "h4", "h5", "h6"];
		this.additionalScripts = options.additionalScripts ?? [];
		this.allowedPaths = options.allowedPaths ?? [];
		this.allowedDomains = options.allowedDomains ?? [];
		this.ignoreHTTPSErrors = options.ignoreHTTPSErrors ?? false;
		this.browserWSEndpoint = options.browserEndpoint;
		this.browserArgs = options.browserArgs ?? [];
		this.timeout = options.timeout ?? 0;
		this.closeAfter = options.closeAfter ?? true;
		this.emulateMedia = options.emulateMedia ?? "print";
		this.additionalStyles = options.additionalStyles ?? [];
		this.enableWarnings = options.enableWarnings ?? false;

		this.pages = new Map();

		if (this.debug) {
			this.headless = false;
			this.closeAfter = false;
		}
	}

	async setup() {
		const puppeteerOptions = {
			// https://github.com/puppeteer/puppeteer/issues/2735#issuecomment-470309033
			// pipe: true,
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
		if (!this.browser)
			await this.setup();

		try {
			const page = await this.browser!.newPage();
			this.pages.set(input, page);
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

			for (const style of this.additionalStyles) {
				await page.addStyleTag({
					path: style,
				});
			}

			for (const script of this.additionalScripts) {
				await page.addScriptTag({
					path: script,
				});
			}

			await page.waitForNetworkIdle({
				timeout: this.timeout,
			});

			return page;
		}
		catch (error) {
			this.closeAfter && this.close();
			throw error;
		}
	}

	async pdf(input: string, options: PDFOptions = {}) {
		let page = this.pages.get(input);
		if (!page) {
			page = await this.render(input)
				.catch((e) => {
					throw e;
				});
		}

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

			const pdfExportOptions: PDFOptions = {
				scale: !options.scale ? 1 : +options.scale,
				timeout: this.timeout,
				displayHeaderFooter: false,
				headerTemplate: options.headerTemplate,
				footerTemplate: options.footerTemplate,
				preferCSSPageSize: options.preferCSSPageSize,
				printBackground: options.printBackground,
				omitBackground: options.omitBackground,
				width: options.width,
				height: options.height,
				landscape: options.landscape,
				format: options.format ?? "letter",
			};

			if (options.margin)
				pdfExportOptions.margin = options.margin;

			if (options.pageRanges)
				pdfExportOptions.pageRanges = options.pageRanges;

			if (options.headerTemplate || options.footerTemplate)
				pdfExportOptions.displayHeaderFooter = true;

			const outline = await getOutline(page, this.outlineTags ?? []);
			const pdf = await page.pdf(pdfExportOptions)
				.catch((e) => {
					throw e;
				});

			this.closeAfter && page.close();
			this.pages.delete(input);

			this.emit("postprocessing");

			const pdfDoc = await PDFDocument.load(pdf);

			setMetadata(pdfDoc, meta);
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
