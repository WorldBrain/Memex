# WebMemex/memextension

A browser extension that lets you grow your personal web of knowledge.

 - :inbox_tray: **Store** pages and :mag: **find** them back *in their context*
 - :memo: **Create pages** to add notes and quotes
 - :link: **Create links** to organise your web by *your associations*
 - :satellite: **Publish** your personal web on the world wide web

Because a row of dozens of tabs or bookmarks needs better organisation.

Because our minds organise by assocation, not by folders or filetypes.

Because browsers were never intended to be just *viewers*.

Let's make web browsers the *web weavers* they ought to be.


## Project status

Sorry to disappoint, but we do not have the promised solution yet. :unamused:

This project is in full development. You are most welcome to contribute! See
[Hacking](#hacking) below about how to build and run it from source and teach it
new tricks.


## Approach

As it stands now, it is a WebExtension (thus should work on most modern
browsers), bundled by [browserify](http://browserify.org) with some
[babel](https://babeljs.io) ES6–7→ES5 compilation, that logs and stores visited
pages in [PouchDB](https://pouchdb.com), and provides a viewer for this data
based on
[React](https://facebook.github.io/react/)+[Redux](http://redux.js.org/). See
[Code Anatomy](#code-anatomy) below for a full tour du code.

The project strategy is to combine and integrate features from other projects,
and to factor out developed functionality into separate modules wherever it
seems sensible. This extension could then be regarded as a bunch of different
(but related) features a browser ought to have, bundled together for quick
installation.

See [our initial blog post](https://blog.webmemex.org/2017/01/05/roadmap/)
for the feature roadmap of the next few months.


## Contribute

Got feedback, bug fixes, new features, tips? Give a shout. :loudspeaker:

Pop in on #webmemex on [Freenode](http://webchat.freenode.net/), send a PR or
open an issue [on GitHub](https://github.com/Treora/memextension), or send
me ([Gerben](https://github.com/Treora)) a message.

Coding, design, communication, there is plenty to be done. Soon we should even
have a tiny bit of funding available to reward contributions. :money_with_wings:


## Hacking

Like playing with ES6, WebExtension browser APIs, React, Redux, PouchDB? Come
play along! :tada:

### Build and run it

1. Clone this repo.
2. Get [Node/NPM](https://nodejs.org).
3. Run `make`.
4. Load it in Firefox or Chromium/Chrome:
    * In Firefox ([≥45](https://blog.mozilla.org/addons/2015/12/23/loading-temporary-add-ons/)):
      go to [`about:debugging`](about:debugging), choose 'Load Temporary
      Add-on', pick `extension/manifest.json` from this repo.
    * In Chromium/Chrome: go to [Tools→Extensions](chrome://extensions/), enable
      'Developer mode', 'Load unpacked extension...', pick the `extension/`
      folder from this repo.
    * Others browsers: let know if you have tested it!


### Automatic recompilation

If the steps above worked, running `make watch` will trigger a quick
recompilation every time a source file has been modified. Depending on which
part of the code you change, you may currently have to reload the extension in
your browser:

- If your edits affected only the overview interface, just refresh/reopen it.
- Likewise, if you changed the 'content_script', the new version will be loaded
  into any page you visit afterwards.
- However, if you changed the background script, you have will to reload the
  extension: find it back in the list of temporary add-ons/extensions and click
  Reload.


## Code Anatomy

### WebExtension parts

To comply with the [anatomy of a WebExtension](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Anatomy_of_a_WebExtension),
it consists of three main parts (found in [`extension/`](extension/) after
compilation):

- `background.js` always runs, in an 'empty invisible tab', listening for
  messages and events.
- `content_script.js` is loaded into every web page that is visited. It is
  invisible from that web page's own scripts, and can talk to the background
  script.
- `overview/overview.html`, with the resources in that folder, provides the main
  user interface.

The parts communicate in two ways:
- Messaging through `browser.sendMessage`, usually done implicitly by using a
  remote procedure call ([`util/webextensionRPC.js`](util/webextensionRPC.js)).
- Through the in-browser PouchDB database, they get to see the same data, and
  can react to changes made by other parts.

Besides these parts,
[`browser-polyfill.js`](https://github.com/mozilla/webextension-polyfill/)
provides the promise-based `browser` API, that simply wraps Chromium/Chrome's
callback-based `chrome` API, in order to make the same code run in different
browsers (and to structure the callback mess).

### Source organisation

To keep things modular, the source code in [`src/`](src/) is not split in
exactly those the three parts of the extension, but is rather grouped by
functionality. Some folders may end up being factored out into separate repos
later on, or at some point perhaps even into separate but interacting browser
extensions.

#### [`src/activity-logger/`](src/activity-logger/): activity logger

This logs every page visit in PouchDB. Soon it should also watch for user
interactions, for example to remember which parts of a page you have read.

Currently, for every visit, a new page object is created in the database, to
represent the visited page itself. This object should soon be deduplicated when
the same page is visited multiple times. After creating a new page object,
the next module is triggered to start analysing the page.

#### [`src/page-analysis`](src/page-analysis/): page analysis

This extracts and stores information about the page in a given tab, such as:
- The plain text of the page, mainly for the full-text
search index.
- Metadata, such as its author, publication date, etcetera.
- A screenshot for visual recognition.

#### [`src/overview/`](src/overview/): overview

The `overview` is the user interface that opens in a tab of its own. It is built
with [React](https://facebook.github.io/react/) and [Redux](http://redux.js.org/),
which create a somewhat complex but nicely organised application structure.

See [`src/overview/Readme.md`](src/overview/Readme.md) for more details.

#### [`src/search`](src/search/): document search

Functions for finding relevant knowledge in the user's memory. Currently
provides a simple full-text keyword search through visited pages using
[pouchdb-quick-search](https://github.com/nolanlawson/pouchdb-quick-search).
This can be improved in many ways, because we are searching through a person's
memory, not just some arbitrary document collection. For example, we can use
created assocations and browsing paths to better understand what one is looking
for.

#### [`src/dev/`](src/dev/): development tools

Tools to help during development. They are not used in production builds.

#### [`src/util/`](src/util): utilities

Contains small generic things, stuff that is not project-specific. Things that
could perhaps be packaged and published as an NPM module some day.

#### `...`: other stuff

The build process is a `Makefile`, that runs some `npm` commands specified in
`package.json`, which in turn start the corresponding tasks in
`gulpfile.babel.js` (transpiled by settings in `.babelrc`). All lurking there
so you only have to type `make` to get things running.

So much for the code tour. :zzz:  Any questions? :point_up:
