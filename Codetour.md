# Code tour

A quick introduction to the folders and files in this repo.

## WebExtension anatomy

To comply with the [anatomy of a WebExtension](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Anatomy_of_a_WebExtension),
this extension consists of the following parts (found in
`extension/` after compilation):

-   `background.js` always runs, in an 'empty invisible tab', listening for
    messages and events.
-   `content_script.js` is loaded into every web page that is visited. It is
    invisible from that web page's own scripts, and can talk to the background
    script.
-   `options.html` (plus resources) is a technically separate application
    that provides the settings page + overview.
-   `popup.html` (plus resources) is a technically separate application
    that provides the extension popup.

The parts communicate in two ways:

-   Messaging through `browser.sendMessage`, usually done implicitly by using a
    remote procedure call ([`util/webextensionRPC.js`](src/util/webextensionRPC.js)).

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

This feature handles logging of every visited page in the DB.

### [`src/page-analysis/`](src/page-analysis/): (web)page analysis

This feature extracts and stores information about the page from a given tab.

### [`src/options/`](src/options/): settings panel

The pages for modifying the extension's settings. It is built
with [React](https://facebook.github.io/react/) and [Redux](http://redux.js.org/).

### [`src/overview/`](src/overview/): overview

The overview is the main user interface for search. It currently lives as a separate
feature module however is part of the same React app as the options pages.

### [`src/imports/`](src/imports/): background browser history + bookmarks imports logic

This feature contains the background script code for our browser history and bookmarks importer.
Note that the UI currently lives in [`src/options/imports/`](src/options/imports).

### [`src/search/`](src/search/): document search

This feature contains the background script code for finding relevant knowledge
in the user's memory. It is the backend used to provide results to the overview and
address bar searches.

### [`src/search-filters/`](src/search-filters/): search filters UI

Contains the UI for various filters that are supported in the search, like filter by tags/domains/collections/bookmarks.

### [`src/popup/`](src/popup/): extension popup

This feature contains the React+Redux app that makes up the extension's popup.
It appears when you press the Memex extension's badge.

### [`src/direct-linking/`](src/direct-linking/): direct linking and annotations

This feature contains all the logic related to enabling in-extension highlights,
annotations, comments, and direct links to highlights on different webpages.

### [`src/notifications/`](src/notifications/): in-extension notifications

This feature contains all the logic related to the notifications that appear in
a user's overview. They get hard-coded into the distributed code as to not contact a
remote server. Note these are different to system/browser notifications.

### [`src/search-injection/`](src/search-injections/): search engine injection of Memex results

This feature contains content script logic used to optional inject memex search results
into the UIs of popuplar search engines. Currently it supports Google and DuckDuckGo.

### [`src/custom-lists/`](src/custom-lists/): custom lists/collections

Contains everything related to the collections feature, which enables users to
group pages into collections/lists.

### [`src/sidebar-overlay/`](src/sidebar-overlay/): highlights and comments sidebar

Code that is responsible for the in-overview and content script sidebar that opens
on the right-hand side of the screen to manage user highlights and comments on given
pages.

### [`src/content-tooltip/`](src/content-tooltip/): in-page highlight tooltip

This feature contains all the code that allows the in-page tooltip to optionally show
when a user makes a text highlight on any webpage.

### [`src/util/`](src/util/): utilities

Contains small generic things, stuff that is not project-specific. Things that
could perhaps be packaged and published as an NPM module some day.

### [`src/dev/`](src/dev/): development tools

Tools to help during development. They are not used in production builds.

### `...`: other stuff

The build process is implemented using webpack v4. The main build entrypoint lives in
`webpack.config.babel.js` with the core logic split up into several modules in the
[`build/`](build/) directory.

And a bunch of other development tool configurations, the usual cruft.

So much for the code tour. :zzz: Any questions? :point_up:
