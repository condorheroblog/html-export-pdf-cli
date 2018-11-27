const Paged = require('pagedjs');
const EventEmitter = require('events');
const puppeteer = require('puppeteer');

// const temp = require("temp").track();
const path = require('path');
const fs = require('fs');

const express = require('express');
const app = express();

const PORT = 9999;

let dir = process.cwd();

let scriptPath = path.resolve(dir, "./node_modules/pagedjs/dist/");

const PDF_SETTINGS = {
  printBackground: true,
  displayHeaderFooter: false,
  preferCSSPageSize: true,
  margin: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }
};

class Printer extends EventEmitter {
  constructor(headless) {
    super();
    this.headless = headless !== false;
  }

  async setup() {
    const browser = await puppeteer.launch({
      headless: this.headless
    });

    return browser;
  }

  async serve(input) {
    let relativePath = path.resolve(dir, input);
    let dirname = path.dirname(relativePath);

    app.use("/print", express.static(dirname))

    let scriptPath = path.resolve(dir, "./node_modules/pagedjs/dist/");
    app.use("/polyfill", express.static(scriptPath))

    app.set('port', process.env.PORT || 0);

    return new Promise(function(resolve, reject) {
      let server = app.listen(app.get('port'), () => {
        resolve(server);
      });
    });
  }

  async render(input) {
    let resolver;
    let rendered = new Promise(function(resolve, reject) {
      resolver = resolve;
    });

    if (!this.browser) {
      this.browser = await this.setup();
    }

    const page = await this.browser.newPage();

    let server = await this.serve(input);
    let port = server.address().port;

    let relativePath = path.resolve(dir, input);
    let basename = path.basename(relativePath);

    await page.goto(`http://localhost:${port}/print/${basename}`)
      .catch((e) => {
        console.error(e);
      });

    await page.exposeFunction('PuppeteerLogger', (msg, counter) => {
      console.log(msg, counter);
      this.emit(msg, counter);
    });

    await page.exposeFunction('onPagesRendered', async (msg, width, height, orientation) => {
      console.log('onPagesRendered', msg, width, height, orientation);
      this.emit(msg, width, height, orientation);
      resolver({msg, width, height, orientation});
    });

    await page.addScriptTag({
      url: `http://localhost:${port}/polyfill/paged.polyfill.js`
    });

    await rendered;

    await page.waitForSelector(".pagedjs_pages");

    server.close();

    return page;
  }

  async pdf(input, options={}) {
    let page = await this.render(input);

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
    }
    let pdf = await page.pdf(PDF_SETTINGS)
      .catch((e) => {
        console.error(e);
      });

    await page.close();
    return pdf;
  }

  async html(input, stayopen) {
    let page = await this.render(input);

    let content = await page.content()
      .catch((e) => {
        console.error(e);
      });

    await page.close();
    return content;
  }

  async preview(input) {
    let page = await this.render(input);
    return page;
  }

}

module.exports = Printer;
