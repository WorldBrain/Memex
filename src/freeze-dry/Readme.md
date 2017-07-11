# Freeze-dry: web page conservation

Freeze-dry stores a web page as it is shown in the browser. It takes the DOM, and returns it as an
HTML string, after having and inlined external resources such as images (as `data:` URLs) and
stylesheets. It removes any scripts and prevents connectivity, so the resulting HTML document is a
static, self-contained snapshot of the page.


## Usage

```
const html = await freezeDry()

// Instead of taking window.document, you can pass a Document object, and possibly its URL.
const htmlString = await freezeDry(document, url)
```


## Why no scripts?

It would be great to keep the interactive features of a page, so that for example a zoomable plot or
drop-down menu would still function. We can however not store the current state of the scripts, and
if we simply execute them again in the snapshotted page, in a different environment, they might
mess up completely. Not running scripts gives a predictable result.

Note that simple interactivity defined in CSS stylesheets will still work.
