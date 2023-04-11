# html-export-pdf-cli

Render Html to PDFs using [Pagedjs](https://gitlab.pagedmedia.org/polyfills/pagedjs) and [Puppeteer](https://github.com/GoogleChrome/puppeteer).

## Installation

```
npm install -g html-export-pdf-cli
```

## Generating a PDF

```
html-export-pdf-cli ./path/to/index.html -o result.pdf
```

## Options

```
-i, --inputs [inputs]                Inputs
-o, --output [output]                Output
-d, --debug                          Debug
-l, --landscape                      Landscape printing (default: false)
-s, --page-size [size]               Print to Page Size [size]
-w, --width [size]                   Print to Page Width [width] in MM
-h --height [size]                   Print to Page Height [weight] in MM
--forceTransparentBackground         Print with transparent background
-t, --timeout [ms]                   Set a max timeout of [ms]
-x, --html                           output html file
-b, --blockLocal                     Disallow access to filesystem for local files
-r, --blockRemote                    Disallow requests to remote servers
--allowedPath [allowedPaths]         Only allow access to given filesystem paths,
                                      repeatable. (default: [])
--allowedDomain [allowedDomains]     Only allow access to given remote domains, repeatable
                                      (default: [])
--outline-tags [tags]                Specifies that an outline should be generated for the
                                      resulting PDF document. [tags] specifies which HTML
                                      tags should be considered for that outline. "h1,h2"
                                      will trigger an outline with "h1" tags as root
                                      elements and "h2" elements as their childs.
--additional-script <script>         Additional script tags which are added to the HTML
                                      document before rendering. This is useful for adding
                                      custom pagedjs handlers. The option can be repeated.
                                      (default: [])
--browserEndpoint <browserEndpoint>  Use a remote Chrome server with browserWSEndpoint
--browserArgs <browserArgs>          Launch Chrome with comma separated args
--media [media]                      Emulate "print" or "screen" media, defaults to print.
--style <style>                      Path to CSS stylesheets to be added before rendering
                                      (default: [])
--warn                               Enable warning logs
--help                               display help for command
```
