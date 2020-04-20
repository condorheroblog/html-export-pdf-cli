# PagedJS PDF Renderer

Render Html to PDFs using [Pagedjs](https://gitlab.pagedmedia.org/polyfills/pagedjs) and [Puppeteer](https://github.com/GoogleChrome/puppeteer).

## Installation

```
npm install -g pagedjs-cli
```

## Generating a PDF

```
pagedjs-cli ./path/to/index.html -o result.pdf
```

## Options

```
-V, --version                     output the version number
-i, --inputs [inputs]             Inputs
-o, --output [output]             Output
-d, --debug                       Debug
-l, --landscape                   Landscape printing (default: false)
-s, --page-size [size]            Print to Page Size [size]
-w, --width [size]                Print to Page Width [width] in MM
-h --height [size]                Print to Page Height [weight] in MM
-t, --timeout [ms]                Set a max timeout of [ms]
-x, --html                        output html file
-b, --blockLocal                  Disallow access to filesystem for local files
-r, --blockRemote                 Disallow requests to remote servers
--allowedPath [allowedPaths]      Only allow access to given filesystem paths, repeatable. (default: [])
--allowedDomain [allowedDomains]  Only allow access to given remote domains, repeatable (default: [])
--outline-tags [tags]             Specifies that an outline should be generated for the resulting PDF
                                  document. [tags] specifies which HTML tags should be considered for that
                                  outline. "h1,h2" will trigger an outline with "h1" tags as root elements
                                  and "h2" elements as their childs.
--additional-script <script>      Additional script tags which are added to the HTML document before
                                  rendering. This is useful for adding custom pagedjs handlers. The option
                                  can be repeated. (default: [])
--browserEndpoint                 Use a remote Chrome server with browserWSEndpoint
```

## Hyphenation

HTML can be pre-processed with soft hyphens by the [Hypher](https://github.com/bramstein/hypher) library.

Pass the abbreviation a language code (such as `en-us` or `de`) when calling the renderer. You can install languages beyond those included the package.json using npm.


```
pagedjs-cli ./path/to/index.html --hyphenate en-us --output
```


## Development
Link and build the JS
```
npm install
npm link
npm install -g gulp

gulp watch
```

To display the output in the browser window before printing,
instead of outputting the file add the `--debug` flag.

```
pagedjs-cli ./path/to/index.html --debug
```

## Testing

Install Mocha with `npm install -g mocha`

Run the tests from the library root with the `mocha` command
```
mocha
```

## Docker

Build the Docker image

```bash
docker build -t pagedmedia/pagedjs-cli .
```

Run the Docker image

```bash
docker run -it --security-opt 'seccomp=seccomp.json' pagedmedia/pagedjs-cli bash
```
