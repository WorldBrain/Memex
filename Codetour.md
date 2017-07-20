# Code tour

A quick introduction to the folders and files in this repo.

## WebExtension anatomy

To comply with the [anatomy of a WebExtension](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Anatomy_of_a_WebExtension),
this extension consists of the following parts (found in
[`extension/`](extension/) after compilation):

- `background.js` always runs, in an 'empty invisible tab', listening for
  messages and events.
- `content_script.js` is loaded into every web page that is visited. It is
  invisible from that web page's own scripts, and can talk to the background
  script.
- `overview/overview.html`, with the resources in that folder, provides the main
  user interface.

The parts communicate in two ways:
- Messaging through `browser.sendMessage`, usually done implicitly by using a
  remote procedure call ([`util/webextensionRPC.js`](src/util/webextensionRPC.js)).
- Through the in-browser PouchDB database, they get to see the same data, and
  can react to changes made by other parts.

Besides these parts,
[`browser-polyfill.js`](https://github.com/mozilla/webextension-polyfill/)
provides the promise-based `browser` API, that simply wraps Chromium/Chrome's
callback-based `chrome` API, in order to make the same code run in different
browsers (and to structure the callback mess).

## Source organisation

To keep things modular, the source code in [`src/`](src/) is not split in
exactly those the three parts of the extension, but is rather grouped by
functionality. Some folders may end up being factored out into separate repos
later on, or at some point perhaps even into separate but interacting browser
extensions.

### [`src/activity-logger/`](src/activity-logger/): activity logger

For logging visits in the database. A visit object points to a page object, which represents the
page itself. Project focus has shifted from logging every visit to manually storing pages, so this
code may be refactored soon.

### [`src/page-analysis/`](src/page-analysis/): (web)page analysis

This extracts and stores information about the page in a given tab, such as:
- A full html version of the rendered page, by 'freeze-drying' it.
- The plain text of the page, mainly for the full-text search.
- Metadata, such as its author, title, etcetera.
- A screenshot for visual recognition.

### [`src/page-storage/`](src/page-storage/): (web)page storage

Everything around managing the pages stored in the database. Mainly created for
grouping the code around comparison and deduplication of stored versions of
web pages, which did not really fit well under another folder.

### [`src/local-page/`](src/local-page/): display stored pages

Code for displaying the locally stored web pages, making them accessible on
their own URL.

### [`src/overview/`](src/overview/): overview

The overview is the user interface that opens in a tab of its own. It is built
with [React](https://facebook.github.io/react/) and [Redux](http://redux.js.org/),
which create a somewhat complex but nicely organised application structure.

See [`src/overview/Readme.md`](src/overview/Readme.md) for more details.

### [`src/popup/`](src/popup/): browser button popup

The UI that shows up when pressing the extension's 'browser_action' button.

### [`src/search/`](src/search/): document search

Functions for finding relevant knowledge in the user's memory. Currently
provides a simple word filter to search through text of visited pages.
This can be improved in many ways, because we are searching through a person's
memory, not just some arbitrary document collection. For example, we can use
created assocations and browsing paths to better understand what one is looking
for.

### [`src/dev/`](src/dev/): development tools

Tools to help during development. They are not used in production builds.

### [`src/util/`](src/util/): utilities

Contains small generic things, stuff that is not project-specific. Things that
could perhaps be packaged and published as an NPM module some day.

### `...`: other stuff

The build process is a `Makefile`, that runs `yarn` and some `npm` commands specified in
`package.json`, which in turn start the corresponding tasks in
`gulpfile.babel.js` (transpiled by settings in `.babelrc`). All lurking there
so you only have to type `make` to get things running.

And a bunch of other development tool configurations, the usual cruft.

So much for the code tour. :zzz:  Any questions? :point_up:
