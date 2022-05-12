import EventEmitter from "events";
import puppeteer from "puppeteer";

import fetch from "node-fetch";

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { PDFDocument } from "pdf-lib";
import { setTrimBoxes, setMetadata } from "./postprocesser.js";

const currentPath = fileURLToPath(import.meta.url);
const dir = process.cwd();

const scriptPath = path.resolve(path.dirname(currentPath), "../dist/browser.js");

class Printer extends EventEmitter {
  constructor(options = {}) {
    super();

    this.headless = options.headless !== false;
    this.allowLocal = options.allowLocal;
    this.allowRemote = options.allowRemote;
    this.additionalScripts = options.additionalScripts || [];
    this.allowedPaths = options.allowedPaths || [];
    this.allowedDomains = options.allowedDomains || [];
    this.ignoreHTTPSErrors = options.ignoreHTTPSErrors;
    this.browserWSEndpoint = options.browserEndpoint;
    this.browserArgs = options.browserArgs;
    this.overrideDefaultBackgroundColor = options.overrideDefaultBackgroundColor;
    this.timeout = options.timeout;

    this.pages = [];
  }

  async setup() {
    let puppeteerOptions = {
      headless: this.headless,
      args: ["--disable-dev-shm-usage", "--export-tagged-pdf"],
      ignoreHTTPSErrors: this.ignoreHTTPSErrors
    };

    if (this.allowLocal) {
      puppeteerOptions.args.push("--allow-file-access-from-files");
    }

    if (this.browserArgs) {
      puppeteerOptions.args.push(...this.browserArgs);
    }

    if (this.browserWSEndpoint) {
      puppeteerOptions.browserWSEndpoint = this.browserWSEndpoint;
      this.browser = await puppeteer.connect(puppeteerOptions);
    } else {
      this.browser = await puppeteer.launch(puppeteerOptions);
    }

    return this.browser;
  }

  async render(input) {
    let resolver;
    let rendered = new Promise(function(resolve, reject) {
      resolver = resolve;
    });

    if (!this.browser) {
      await this.setup();
    }

    const page = await this.browser.newPage();
    if (this.timeout) {
      page.setDefaultTimeout(this.timeout);
    }

    if (this.overrideDefaultBackgroundColor) {
      page._client.send('Emulation.setDefaultBackgroundColorOverride', { color: this.overrideDefaultBackgroundColor });
    }

    let uri, url, relativePath, html;
    if (typeof input === "string") {
      try {
        uri = new URL(input);
        url = input;
      } catch (error) {
        relativePath = path.resolve(dir, input);

        if (this.browserWSEndpoint) {
          html = fs.readFileSync(relativePath, 'utf-8')
        } else {
          url = "file://" + relativePath;
        }
      }
    } else {
      url = input.url;
      html = input.html;
    }

    await page.setRequestInterception(true);

    page.on('request', (request) => {
      let uri = new URL(request.url());
      let { host, protocol, pathname } = uri;
      let local = protocol === "file:"

      if (local && this.withinAllowedPath(pathname) === false) {
        request.abort();
        return;
      }

      if (local && !this.allowLocal) {
        request.abort();
        return;
      }

      if (host && this.isAllowedDomain(host) === false) {
        request.abort();
        return;
      }

      if (host && !this.allowRemote) {
        request.abort();
        return;
      }

      request.continue();
    });

    if (html) {
      await page.setContent(html);

      if (url) {
        await page.evaluate((url) => {
          let base = document.querySelector("base");
          if (!base) {
            base = document.createElement("base");
            document.querySelector("head").appendChild(base);
          }
          base.setAttribute("href", url);
        }, url);
      }

    } else {
      await page.goto(url);
    }

    await page.evaluate(() => {
      window.PagedConfig = window.PagedConfig || {};
      window.PagedConfig.auto = false;
    });

    await page.addScriptTag({
      path: scriptPath
    });

    for (const script of this.additionalScripts) {
      await page.addScriptTag({
        path: script
      });
    }

    // await page.exposeFunction("PuppeteerLogger", (msg) => {
    //   console.log(msg);
    // });

    await page.exposeFunction("onSize", (size) => {
      this.emit("size", size);
    });

    await page.exposeFunction("onPage", (page) => {
      // console.log("page", page.position + 1);

      this.pages.push(page);

      this.emit("page", page);
    });

    await page.exposeFunction("onRendered", (msg, width, height, orientation) => {
      this.emit("rendered", msg, width, height, orientation);
      resolver({msg, width, height, orientation});
    });

    await page.evaluate(async () => {
      let done;
      window.PagedPolyfill.on("page", (page) => {
        const { id, width, height, startToken, endToken, breakAfter, breakBefore, position } = page;

        const mediabox = page.element.getBoundingClientRect();
        const cropbox = page.pagebox.getBoundingClientRect();

        function getPointsValue(value) {
          return (Math.round(CSS.px(value).to("pt").value * 100) / 100);
        }

        let boxes = {
          media: {
            width: getPointsValue(mediabox.width),
            height: getPointsValue(mediabox.height),
            x: 0,
            y: 0
          },
          crop: {
            width: getPointsValue(cropbox.width),
            height: getPointsValue(cropbox.height),
            x: getPointsValue(cropbox.x) - getPointsValue(mediabox.x),
            y: getPointsValue(cropbox.y) - getPointsValue(mediabox.y)
          }
        };

        window.onPage({ id, width, height, startToken, endToken, breakAfter, breakBefore, position, boxes });
      });

      window.PagedPolyfill.on("size", (size) => {
        window.onSize(size);
      });

      window.PagedPolyfill.on("rendered", (flow) => {
        let msg = "Rendering " + flow.total + " pages took " + flow.performance + " milliseconds.";
        window.onRendered(msg, flow.width, flow.height, flow.orientation);
      });

      if (window.PagedConfig.before) {
        await window.PagedConfig.before();
      }

      done = await window.PagedPolyfill.preview();

      if (window.PagedConfig.after) {
        await window.PagedConfig.after(done);
      }
    }).catch((error) => {
      throw error;
    });

    await rendered;

    await page.waitForSelector(".pagedjs_pages");

    return page;
  }

  async pdf(input, options={}) {
    let page = await this.render(input)
      .catch((e) => {
        throw e;
      });

    // Get metatags
    const meta = await page.evaluate(() => {
      let meta = {};
      let title = document.querySelector("title");
      if (title) {
        meta.title = title.textContent.trim();
      }
      let lang = document.querySelector("html").getAttribute("lang");
      if (lang) {
        meta.lang = lang;
      }
      let metaTags = document.querySelectorAll("meta");
      [...metaTags].forEach((tag) => {
        if (tag.name) {
          meta[tag.name] = tag.content;
        }
      });
      return meta;
    });

    let settings = {
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: options.width ? false : true,
      width: options.width,
      height: options.height,
      orientation: options.orientation,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      }
    };

    let pdf = await page.pdf(settings)
      .catch((e) => {
        throw e;
      });

    await page.close();

    this.emit("postprocessing");

    let pdfDoc = await PDFDocument.load(pdf);

    setMetadata(pdfDoc, meta);
    setTrimBoxes(pdfDoc, this.pages);

    pdf = await pdfDoc.save();

    return pdf;
  }

  async html(input, stayopen) {
    let page = await this.render(input);

    let content = await page.content();

    await page.close();
    return content;
  }

  async preview(input) {
    let page = await this.render(input);
    return page;
  }

  async close() {
    return this.browser.close();
  }

  withinAllowedPath(pathname) {
    if (!this.allowedPaths || this.allowedPaths.length === 0) {
      return true;
    }

    for (let parent of this.allowedPaths) {
      const relative = path.relative(parent, pathname);
      if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
        return true;
      }
    }

    return false;
  }

  isAllowedDomain(domain) {
    if (!this.allowedDomains || this.allowedDomains.length === 0) {
      return true;
    }
    return this.allowedDomains.includes(domain);
  }

}

export default Printer;
