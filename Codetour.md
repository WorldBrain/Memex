# Code tour

A quick introduction to the folders and files in this repo.

## WebExtension anatomy

To comply with the [anatomy of a WebExtension](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Anatomy_of_a_WebExtension),
this extension consists of the following parts (found in
[`extension/`](extension/) after compilation):

-   `background.js` always runs, in an 'empty invisible tab', listening for
    messages and events.
-   `content_script.js` is loaded into every web page that is visited. It is
    invisible from that web page's own scripts, and can talk to the background
    script.
-   `overview/overview.html`, with the resources in that folder, provides the main
    user interface.
-   `options/options.html` (plus resources) is a technically separate application
    that provides the settings page.

The parts communicate in two ways:

-   Messaging through `browser.sendMessage`, usually done implicitly by using a
    remote procedure call ([`util/webextensionRPC.js`](src/util/webextensionRPC.js)).
-   Through the in-browser PouchDB database, they get to see the same data, and
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

This logs every page visit in PouchDB. Soon it should also watch for user
interactions, for example to remember which parts of a page you have read.

Currently, for every visit, a new page object is created in the database, to
represent the visited page itself. This object should soon be deduplicated when
the same page is visited multiple times. After creating a new page object,
the next module is triggered to start analysing the page.

### [`src/page-analysis/`](src/page-analysis/): (web)page analysis

This extracts and stores information about the page in a given tab, such as:

-   A full html version of the rendered page, by 'freeze-drying' it.
-   The plain text of the page, mainly for the full-text search.
-   Metadata, such as its author, title, etcetera.
-   A screenshot for visual recognition.

### [`src/page-storage/`](src/page-storage/): (web)page storage

Code for displaying the locally stored web pages, making them accessible on
their own URL.

### [`src/overview/`](src/overview/): overview

The overview is the user interface that opens in a tab of its own. It is built
with [React](https://facebook.github.io/react/) and [Redux](http://redux.js.org/),
which create a somewhat complex but nicely organised application structure.

See [`src/overview/Readme.md`](src/overview/Readme.md) for more details.

### [`src/options/`](src/options/): settings panel

The page for modifying the settings is implemented as an individual React app.
Currently it does not do much yet.

### [`src/imports/`](src/imports/): background browser history + bookmarks imports logic

Currently unused code for importing information from the browser's own history.
Still to be developed and reorganised.

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

The build process is implemented using webpack v4. The main build entrypoint lives in
`webpack.config.babel.js` with the core logic split up into several modules in the `build/` directory.

And a bunch of other development tool configurations, the usual cruft.

So much for the code tour. :zzz: Any questions? :point_up:
