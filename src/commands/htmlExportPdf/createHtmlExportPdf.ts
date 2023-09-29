import type { Command } from "commander";

import { collectParameters, commaSeparatedList } from "../../utils";
import { htmlExportPdf } from "./htmlExportPdf";

export function createHtmlExportPdf(program: Command) {
	program
		.arguments("[inputs...]")
		.option("-i, --inputs <inputs>", "Input one or more local or online paths", collectParameters, [])
		.option("-o, --outFile [outFile]", "Output file name(default: {input}.pdf)")
		.option("--outDir [outDir]", "Output directory(default: process.cwd())")
		.option("--headless [headless]", "Whether to run the browser in headless mode(default: 'new')", (v) => {
			if (v === "false")
				return false;

			if (v === "true")
				return true;

			return v;
		}, "new")

		// https://pptr.dev/api/puppeteer.pdfoptions
		.option("--scale <scale>", "Scales the rendering of the web page. Amount must be between 0.1 and 2(default: 1)", v => Number(v), 1)
		.option("--headerTemplate <headerTemplate>", "HTML template for the print header")
		.option("--footerTemplate <footerTemplate>", "HTML template for the print footer")
		.option("--preferCSSPageSize", "Give any CSS @page size declared in the page priority over what is declared in the width or height or format option(default: false)", false)
		.option("--printBackground", "Set to print background graphics(default: false)", false)
		.option("--omitBackground", "Hides default white background and allows generating PDFs with transparency(default: false)", false)
		.option("--pageRanges <pageRanges>", "Paper ranges to print, e.g. 1-5, 8, 11-13")
		.option("-m, --margin <margin>", "Set the PDF margins. e.g. top=10,bottom=10,left=10,right=10")
		.option("-l, --landscape", "Whether to print in landscape orientation(default: false)", false)
		.option("-s, --page-size <size>", "Print to Page Size", "letter")
		.option("-w, --width <width>", "Print to Page Width")
		.option("-h --height <height>", "Print to Page Height")
		.option("-t, --timeout <ms>", "Set a max timeout of ms")

		.option("-x, --html", "output html file")
		.option("-b, --blockLocal", "Disallow access to filesystem for local files(default: false)", false)
		.option("-r, --blockRemote", "Disallow requests to remote servers(default: false)", false)
		.option("--outlineContainerSelector <outlineContainerSelector>", "Specify an outline container selector")
		.option("--allowedPaths <allowedPaths>", "Only allow access to given filesystem paths, repeatable", collectParameters, [])
		.option("--allowedDomains <allowedDomains>", "Only allow access to given remote domains, repeatable", collectParameters, [])
		.option("--ignoreHTTPSErrors", "Whether to ignore HTTPS errors during navigation(default: false)", false)
		.option("--outline-tags <tags>", "Add outlines (bookmarks) to PDF", commaSeparatedList, ["h1", "h2", "h3", "h4", "h5", "h6"])
		.option("--additional-scripts <additionalScripts>", "additional script tags to the HTML document", collectParameters, [])
		.option("--additional-styles <additionalStyles>", "additional style tags to the HTML document", collectParameters, [])
		.option("--browserEndpoint", "Use a remote Chrome server with browserWSEndpoint")
		.option("--browserArgs <browserArgs>", "Launch Chrome with comma separated args", commaSeparatedList)
		.option("--media <media>", "Emulate print or screen media, defaults to print(default: 'print')", "print")
		.option("-d, --debug", "Debug")
		.option("--warn", "Enable warning logs")
		.action(htmlExportPdf);
}
