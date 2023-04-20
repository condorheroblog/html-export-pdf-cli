import type { Command } from "commander";

import { collectParameters, commaSeparatedList } from "../../utils";
import { htmlExportPdf } from "./htmlExportPdf";

export function createHtmlExportPdf(program: Command) {
	program
		.arguments("[inputs...]")
		.option("-i, --inputs [inputs]", "Input one or more local or online paths", collectParameters, [])
		.option("-o, --outFile [outFile]", "Output file name")
		.option("--outDir [outDir]", "Output directory(default: process.cwd())")

		// https://pptr.dev/api/puppeteer.pdfoptions
		.option("--scale [scale]", "Scales the rendering of the web page. Amount must be between 0.1 and 2", "1")
		.option("--headerTemplate [headerTemplate]", "HTML template for the print header")
		.option("--footerTemplate [footerTemplate]", "HTML template for the print footer")
		.option("--preferCSSPageSize [preferCSSPageSize]", "Give any CSS @page size declared in the page priority over what is declared in the width or height or format option", false)
		.option("--printBackground [printBackground]", "Set to print background graphics", false)
		.option("--omitBackground [omitBackground]", "Hides default white background and allows generating PDFs with transparency", false)
		.option("--pageRanges [pageRanges]", "Paper ranges to print, e.g. 1-5, 8, 11-13")
		.option("-m, --margin [margin]", "Set the PDF margins. e.g. top=10,bottom=10,left=10,right=10")
		.option("-l, --landscape [landscape]", "Whether to print in landscape orientation", false)
		.option("-s, --page-size [size]", "Print to Page Size [size]", "letter")
		.option("-w, --width [size]", "Print to Page Width [width] in MM")
		.option("-h --height [size]", "Print to Page Height [weight] in MM")
		.option("-t, --timeout [ms]", "Set a max timeout of [ms]")

		.option("-x, --html", "output html file")
		.option("-b, --blockLocal", "Disallow access to filesystem for local files", true)
		.option("-r, --blockRemote", "Disallow requests to remote servers")
		.option("--allowedPaths [allowedPaths]", "Only allow access to given filesystem paths, repeatable.", collectParameters, [])
		.option("--allowedDomains [allowedDomains]", "Only allow access to given remote domains, repeatable", collectParameters, [])
		.option("--ignoreHTTPSErrors [ignoreHTTPSErrors]", "Whether to ignore HTTPS errors during navigation", false)
		.option("--outline-tags [tags]", "Add outlines (bookmarks) to PDF", commaSeparatedList, ["h1", "h2", "h3", "h4", "h5", "h6"])
		.option("--additional-scripts [additionalScripts]", "additional script tags to the HTML document", collectParameters, [])
		.option("--additional-styles [additionalStyles]", "additional style tags to the HTML document", collectParameters, [])
		.option("--browserEndpoint [browserEndpoint]", "Use a remote Chrome server with browserWSEndpoint")
		.option("--browserArgs [browserArgs]", "Launch Chrome with comma separated args", commaSeparatedList)
		.option("--media [media]", "Emulate print or screen media, defaults to print.", "print")
		.option("-d, --debug", "Debug")
		.option("--warn", "Enable warning logs")
		.action(htmlExportPdf);
}
