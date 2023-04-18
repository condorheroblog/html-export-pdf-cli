import type { Command } from "commander";

import { collectParameters, commaSeparatedList } from "../../utils";
import { htmlExportPdf } from "./htmlExportPdf";

export function createHtmlExportPdf(program: Command) {
	program
		.arguments("[inputs...]")
		.option("-i, --inputs [inputs]", "Inputs", collectParameters, [])
		.option("-o, --outFile [outFile]", "OutFile")
		.option("--outDir [outDir]", "OutDir")
		.option("-d, --debug", "Debug")
		.option("-l, --landscape", "Landscape printing", false)
		.option("-s, --page-size [size]", "Print to Page Size [size]")
		.option("-w, --width [size]", "Print to Page Width [width] in MM")
		.option("-h --height [size]", "Print to Page Height [weight] in MM")
	// .option("--forceTransparentBackground", "Print with transparent background")
		.option("-t, --timeout [ms]", "Set a max timeout of [ms]")
		.option("-x, --html", "output html file")
		.option("-b, --blockLocal", "Disallow access to filesystem for local files", true)
		.option("-r, --blockRemote", "Disallow requests to remote servers")
		.option("--allowedPath [allowedPaths]", "Only allow access to given filesystem paths, repeatable.", collectParameters, [])
		.option("--allowedDomain [allowedDomains]", "Only allow access to given remote domains, repeatable", collectParameters, [])
		.option("--outline-tags [tags]", "Specifies that an outline should be "
		+ "generated for the resulting PDF document. [tags] specifies which "
		+ "HTML tags should be considered for that outline. "
		+ "\"h1,h2\" will trigger an outline with \"h1\" tags as root elements "
		+ "and \"h2\" elements as their childs.", commaSeparatedList, ["h1", "h2", "h3", "h4", "h5", "h6"])
		.option("--additional-script <script>", "Additional script tags which are "
		+ "added to the HTML document before rendering. This is useful for "
		+ "adding custom pagedjs handlers. The option can be repeated.",
		collectParameters, [])
		.option("--browserEndpoint <browserEndpoint>", "Use a remote Chrome server with browserWSEndpoint")
		.option("--browserArgs <browserArgs>", "Launch Chrome with comma separated args", commaSeparatedList)
		.option("--media [media]", "Emulate \"print\" or \"screen\" media, defaults to print.")
		.option("--styles <styles>", "Path to CSS stylesheets to be added before rendering", collectParameters, [])
		.option("--warn", "Enable warning logs")
		.action(htmlExportPdf);
}
