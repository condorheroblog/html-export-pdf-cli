# html-export-pdf-cli

[![NPM version](https://img.shields.io/npm/v/html-export-pdf-cli)](https://www.npmjs.com/package/html-export-pdf-cli)
[![NPM Downloads](https://img.shields.io/npm/dm/html-export-pdf-cli)](https://www.npmjs.com/package/html-export-pdf-cli)
[![LICENSE](https://img.shields.io/github/license/condorheroblog/html-export-pdf-cli.svg)](https://github.com/condorheroblog/html-export-pdf-cli/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/condorheroblog/html-export-pdf-cli)](https://github.com/condorheroblog/html-export-pdf-cli)

Render HTML to PDF(**with outline**) using [Puppeteer](https://github.com/GoogleChrome/puppeteer).

## Features

- 🖥️ Converting HTML to PDF for `.html`, `.htm`, `.xhtml` file formats
- 📑 **Added PDF outline**
- ⚙️ Configurations for generating PDF with Puppeteer —— [pdfOptions](https://github.com/puppeteer/puppeteer/blob/main/docs/api/puppeteer.pdfoptions.md)
- 📂 Multi-file PDF generation
- ⌨️ Developed in TypeScript
- ⏬ Download web page

## Installation

```bash
# Global installation
npm install -g html-export-pdf-cli

# Local installation
npm install --save-dev html-export-pdf-cli
```

The installed `html-export-pdf-cli` command is available.

## Usage

### Generating a PDF

```bash
html-export-pdf-cli ./index.html -o result.pdf
```

### Generating two PDFs

```bash
html-export-pdf-cli ./index.html ./home.html
# or
html-export-pdf-cli -t ./index.html -t ./home.html
html-export-pdf-cli --inputs ./index.html --inputs ./home.html
```

### Generating some PDFs

This Library uses glob to parse the path you enter, and its syntax refers to the [glob documentation](https://github.com/mrmlnc/fast-glob#basic-syntax).

```bash
html-export-pdf-cli ./pdf/*.html
```

### Outline

```bash
html-export-pdf-cli ./index.html --outlineTags h1,h2 -o index.pdf
```

Using outlineContainerSelector specify an outline container selector

```bash
html-export-pdf-cli ./index.html --outlineContainerSelector .VPDoc --outlineTags h1,h2 -o index.pdf
```

### Additional Scripts

```bash
html-export-pdf-cli ./index.html --additionalScripts a.js --additionalScripts b.js -o index.pdf
```
### Additional Styles

```bash
html-export-pdf-cli ./index.html --additionalStyles a.css --additionalStyles b.css -o index.pdf
```

### PDF Options

You can customize all configuration parameters for Puppeteer to generate PDF except `path`.

| Property            | Modifiers             | Type                                      | Description                                                                                                                                                                                                                                                                                                                                                                     | Default                                                                  |
| ------------------- | --------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| footerTemplate      | <code>optional</code> | string                                    | HTML template for the print footer. Has the same constraints and support for special classes as PDFOptions.headerTemplate.                                                                                                                                                                                                                                                      |                                                                          |
| format              | <code>optional</code> | [PaperFormat](#paperformat)               |                                                                                                                                                                                                                                                                                                                                                                                 | <code>letter</code>.                                                     |
| headerTemplate      | <code>optional</code> | string                                    | <p>HTML template for the print header. Should be valid HTML with the following classes used to inject values into them:</p><p>- <code>date</code> formatted print date</p><p>- <code>title</code> document title</p><p>- <code>url</code> document location</p><p>- <code>pageNumber</code> current page number</p><p>- <code>totalPages</code> total pages in the document</p> |                                                                          |
| height              | <code>optional</code> | string \| number                          | Sets the height of paper. You can pass in a number or a string with a unit.                                                                                                                                                                                                                                                                                                     |                                                                          |
| landscape           | <code>optional</code> | boolean                                   | Whether to print in landscape orientation.                                                                                                                                                                                                                                                                                                                                      | <code>false</code>                                                       |
| margin              | <code>optional</code> | [PDFMargin](#pdfmargin)                   | Set the PDF margins.                                                                                                                                                                                                                                                                                                                                                            | <code>undefined</code> no margins are set.                               |
| omitBackground      | <code>optional</code> | boolean                                   | Hides default white background and allows generating PDFs with transparency.                                                                                                                                                                                                                                                                                                    | <code>false</code>                                                       |
| pageRanges          | <code>optional</code> | string                                    | Paper ranges to print, e.g. <code>1-5, 8, 11-13</code>.                                                                                                                                                                                                                                                                                                                         | The empty string, which means all pages are printed.                     |
| preferCSSPageSize   | <code>optional</code> | boolean                                   | Give any CSS <code>@page</code> size declared in the page priority over what is declared in the <code>width</code> or <code>height</code> or <code>format</code> option.                                                                                                                                                                                                        | <code>false</code>, which will scale the content to fit the paper size.  |
| printBackground     | <code>optional</code> | boolean                                   | Set to <code>true</code> to print background graphics.                                                                                                                                                                                                                                                                                                                          | <code>false</code>                                                       |
| scale               | <code>optional</code> | number                                    | Scales the rendering of the web page. Amount must be between <code>0.1</code> and <code>2</code>.                                                                                                                                                                                                                                                                               | <code>1</code>                                                           |
| timeout             | <code>optional</code> | number                                    | Timeout in milliseconds. Pass <code>0</code> to disable timeout.                                                                                                                                                                                                                                                                                                                | <code>30_000</code>                                                      |
| width               | <code>optional</code> | string \| number                          | Sets the width of paper. You can pass in a number or a string with a unit.                                                                                                                                                                                                                                                                                                      |                                                                          |

#### Format

```bash
html-export-pdf-cli ./index.html -s A0 -o index.pdf
# or
html-export-pdf-cli ./index.html --pageSize A0 -o index.pdf
```

#### Margin

```bash
html-export-pdf-cli ./index.html -m top=10,bottom=10,left=10,right=10 -o index.pdf
# or
html-export-pdf-cli ./index.html --margin top=10,bottom=10,left=10,right=10 -o index.pdf
```

The order can be customized, even omitting a few.

```bash
html-export-pdf-cli ./index.html -m top=10 -o index.pdf
html-export-pdf-cli ./index.html -m right=10 -o index.pdf
html-export-pdf-cli ./index.html -m right=10,left=10 -o index.pdf
html-export-pdf-cli ./index.html -m top=10,left=10 -o index.pdf
```

#### Page Ranges

```bash
html-export-pdf-cli ./index.html --pageRanges 1-5 -o index.pdf
```

#### OmitBackground

```bash
html-export-pdf-cli ./index.html --omitBackground -o index.pdf
```

etc.

#### [PaperFormat](https://github.com/puppeteer/puppeteer/blob/main/docs/api/puppeteer.paperformat.md)


#### [PDFMargin](https://github.com/puppeteer/puppeteer/blob/main/docs/api/puppeteer.pdfmargin.md)

## PDF File Name Convention

Rules for automatically generating PDF file names.

| URL                                           | Filename                     |
|-----------------------------------------------|------------------------------|
| `https://www.example.com/`                    | `www.example.com.pdf`        |
| `https://www.example.com:80/`                 | `www.example.com.pdf`        |
| `https://www.example.com/resource`            | `resource.pdf`               |
| `https://www.example.com/resource.extension`  | `resource.pdf`               |
| `https://www.example.com/path/`               | `path.pdf`                   |
| `https://www.example.com/path/to/`            | `path_to.pdf`                |
| `https://www.example.com/path/to/resource`    | `resource.pdf`               |
| `https://www.example.com/path/to/resource.ext`| `resource.pdf`               |
| `file:///User/path/to/resource.html`          | `resource.pdf`               |

## Options

| Key                          | Type                  | CLI option                      | Description                                                                                                                   |  Default Value         |
| :--------------------------- | :--------------------:| :-----------------------------: | :---------------------------------------------------------------------------------------------------------------------------: | :---------------------:|
| `inputs`                     | `string[]`            | `--inputs`                      | Input one or more local or online paths.                                                                                      | `[]`                   |
| `outFile`                    | `string`              | `--outFile`                     | Output file name.                                                                                                             | {input}.pdf            |
| `outDir`                     | `string`              | `--outDir`                      | Output directory.                                                                                                             | `process.cwd()`        |
| `headless`                   | `boolean` \| `new`    | `--headless`                    | Whether to run the browser in headless mode.                                                                                  | `new`                  |
| `PDFOptions`                 | `object`              |                                 | Valid options to configure PDF generation via Page.pdf().                                                                     |                        |
| ┗ `scale`                    | `number`              | `--scale`                       | Scales the rendering of the web page. Amount must be between 0.1 and 2.                                                       | 1                      |
| ┗ `headerTemplate`           | `string`              | `--headerTemplate`              | HTML template for the print header.                                                                                           |                        |
| ┗ `footerTemplate`           | `string`              | `--footerTemplate`              | HTML template for the print footer.                                                                                           |                        |
| ┗ `preferCSSPageSize`        | `boolean`             | `--preferCSSPageSize`           | Give any CSS @page size declared in the page priority over what is declared in the width or height or format option.          | `false`                |
| ┗ `printBackground`          | `boolean`             | `--printBackground`             | Set to print background graphics.                                                                                             | `false`                |
| ┗ `omitBackground`           | `boolean`             | `--omitBackground`              | Hides default white background and allows generating PDFs with transparency.                                                  | `false`                |
| ┗ `pageRanges`               | `string`              | `--pageRanges`                  | Paper ranges to print, e.g. `1-5, 8, 11-13`.                                                                                  |                        |
| ┗ `margin`                   | `object`              | `-m, --margin`                  | Set the PDF margins. e.g. `top=10,bottom=10,left=10,right=10`.                                                                |                        |
| ┗ `landscape`                | `boolean`             | `-l, --landscape`               | Whether to print in landscape orientation.                                                                                    | `false`                |
| ┗ `pageSize`                 | `string`              | `-s, --page-size`               | Print to Page Size [size].                                                                                                    | `letter`               |
| ┗ `width`                    | `string` \| `number`  | `-w, --width`                   | Print to Page Width [width] in MM.                                                                                            |                        |
| ┗ `height`                   | `string` \| `number`  | `-h, --height`                  | Print to Page Height [height] in MM.                                                                                          |                        |
| ┗ `timeout`                  | `number`              | `-t, --timeout`                 | Set a max timeout of [ms].                                                                                                    |                        |
| `html`                       | `boolean`             | `-x, --html`                    | Output html file.                                                                                                             |                        |
| `blockLocal`                 | `boolean`             | `-b, --blockLocal`              | Disallow access to filesystem for local files.                                                                                | `false`                |
| `blockRemote`                | `boolean`             | `-r, --blockRemote`             | Disallow requests to remote servers.                                                                                          | `false`                |
| `outlineContainerSelector`   | `string`              | `--outlineContainerSelector`    | Specify an outline container selector.                                                                                        |                        |
| `allowedPaths`               | `string[]`            | `--allowedPaths`                | Only allow access to given filesystem paths, repeatable.                                                                      | `[]`                   |
| `ignoreHTTPSErrors`          | `boolean`             | `--ignoreHTTPSErrors`           | Whether to ignore HTTPS errors during navigation.                                                                             | `false`                |
| `allowedDomains`             | `string[]`            | `--allowedDomains`              | Only allow access to given remote domains, repeatable.                                                                        | `[]`                   |
| `outlineTags`                | `string[]`            | `--outline-tags`                | Add outlines (bookmarks) to PDF.                                                                                              |[`h1,h2,h3,h4,h5,h6`]   |
| `additionalScripts`          | `string[]`            | `--additional-scripts`          | additional script tags to the HTML document.                                                                                  | `[]`                   |
| `additionalStyles`           | `string[]`            | `--additional-styles`           | additional style tags to the HTML document.                                                                                   | `[]`                   |
| `browserEndpoint`            | `string`              | `--browserEndpoint`             | Use a remote Chrome server with browserWSEndpoint.                                                                            |                        |
| `browserArgs`                | `string[]`            | `--browserArgs`                 | Launch Chrome with comma separated args.                                                                                      | `[]`                   |
| `media`                      | `string`              | `--media`                       | Emulate `print` or `screen` media, defaults to print.                                                                         | `print`                |
| `debug`                      | `boolean`             | `--debug`                       | Debug.                                                                                                                        | `false`                |
| `warn`                       | `boolean`             | `--warn`                        | Enable warning logs.                                                                                                          | `false`                |


## License

This library is under the [MIT License](https://github.com/condorheroblog/html-export-pdf-cli/blob/main/LICENSE).
