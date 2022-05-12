#!/usr/bin/env node
import { program } from "commander";
import ora from "ora";
import path from "path";
import fs from "fs";
import replaceExt from "replace-ext";

import Printer from "./printer.js";

// import pkg from "../package.json" assert { type: "json" };

function commaSeparatedList(value) {
  return value.split(',');
}

program
  // .version(pkg.version)
  .arguments("[inputPath]")
  .option("-i, --inputs [inputs]", "Inputs")
  .option("-o, --output [output]", "Output")
  .option("-d, --debug", "Debug")
  .option("-l, --landscape", "Landscape printing", false)
  .option("-s, --page-size [size]", "Print to Page Size [size]")
  .option("-w, --width [size]", "Print to Page Width [width] in MM")
  .option("-h --height [size]", "Print to Page Height [weight] in MM")
  .option("--forceTransparentBackground", "Print with transparent background")
  .option("-t, --timeout [ms]", "Set a max timeout of [ms]")
  .option("-x, --html", "output html file")
  .option("-b, --blockLocal", "Disallow access to filesystem for local files")
  .option("-r, --blockRemote", "Disallow requests to remote servers")
  .option("--allowedPath [allowedPaths]", "Only allow access to given filesystem paths, repeatable.", collect, [])
  .option("--allowedDomain [allowedDomains]", "Only allow access to given remote domains, repeatable", collect, [])
  .option("--outline-tags [tags]", "Specifies that an outline should be " +
          "generated for the resulting PDF document. [tags] specifies which " +
          "HTML tags should be considered for that outline. " +
          "\"h1,h2\" will trigger an outline with \"h1\" tags as root elements " +
          "and \"h2\" elements as their childs.")
  .option("--additional-script <script>", "Additional script tags which are " +
          "added to the HTML document before rendering. This is useful for " +
          "adding custom pagedjs handlers. The option can be repeated.",
          collect, [])
  .option("--browserEndpoint <browserEndpoint>", "Use a remote Chrome server with browserWSEndpoint")
  .option("--browserArgs <browserArgs>", "Launch Chrome with comma separated args", commaSeparatedList)
  .parse(process.argv);

function collect(value, previous) {
  return previous.concat(value);
}

const options = program.opts();

let input = options.inputs || program.args[0];

let dir = process.cwd();

let relativePath;
let allowLocal;
try {
  let uri = new URL(input);
  allowLocal = false;
} catch (error) {
  relativePath = path.resolve(dir, input);
  allowLocal = !options.blockLocal;
}

let output;

let headless = typeof options.debug === "undefined";

if (!input) {
  console.error("You must include an input path");
  process.exit(1);
}

if (relativePath) {

  if ([".html", ".xhtml"].indexOf(path.extname(relativePath)) === -1) {
    console.error("Must pass a html or xhtml file as input");
    process.exit(1);
  }

  try {
      fs.accessSync(relativePath, fs.F_OK);
  } catch (e) {
      console.error("Input cannot be found", e);
      process.exit(1);
  }
}

if (typeof(options.output) === "string") {
  output = path.resolve(dir, options.output);
} else if (typeof(options.output) !== "undefined") {
  output = "./" + replaceExt(path.basename(input), ".pdf");
} else {
  output = "output.pdf";
}


const spinner = ora({
  spinner: "circleQuarters"
});


if (typeof input === "string") {
  spinner.start("Loading: " + input);
} else {
  spinner.start("Loading");
}

(async () => {
  const printerOptions = {
    headless: headless,
    allowLocal: allowLocal,
    allowRemote: !options.blockRemote,
    allowedPaths: options.allowedPaths,
    allowedDomains: options.allowedDomains,
    additionalScripts: options.additionalScript,
    browserEndpoint: options.browserEndpoint,
    timeout: options.timeout,
    browserArgs: options.browserArgs
  };

  if (options.forceTransparentBackground) {
    printerOptions.overrideDefaultBackgroundColor = { r: 0, g: 0, b: 0, a: 0 }; // Workaround to get a transparent background in the resulting PDF. See https://bugs.chromium.org/p/chromium/issues/detail?id=498892 for more information.
  }

  let printer = new Printer(printerOptions);

  printer.on("page", (page) => {
    if (page.position === 0) {
      spinner.succeed("Loaded");

      spinner.start("Rendering: Page " + (page.position + 1));
    } else {
      spinner.text = "Rendering: Page " + (page.position + 1);
    }
  });

  printer.on("rendered", (msg) => {
    spinner.succeed(msg);
    spinner.start("Generating");
  });

  printer.on("postprocessing", (msg) => {
    spinner.succeed("Generated");
    spinner.start("Processing");
  });

  let file;
  if (headless) {
    let options = {};
    if (options.html) {
      file = await printer.html(input, options)
        .catch((e) => {
          console.error(e);
          process.exit(1);
        });
      output = replaceExt(output, ".html");
    } else {
      options.outlineTags = !options.outlineTags ? [] : options.outlineTags.split(",");
      file = await printer.pdf(input, options)
        .catch((e) => {
          console.error(e);
          process.exit(1);
        });
    }
  } else {
    printer.preview(input);
  }

  spinner.succeed("Processed");

  if (file) {
    fs.writeFile(output, file, (err) => {
      if (err) throw err;
      spinner.succeed("Saved to " + output);
      process.exit(0);
    });
  }
})();
