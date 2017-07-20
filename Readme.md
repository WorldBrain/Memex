# WebMemex browser extension

A browser extension that lets you grow your personal web of knowledge.

 - 📥 **Store** pages and 🔍 **find** them back *in their context*
 - 📝 **Create pages** to add notes and quotes *(🚧 in development)*
 - 🔗 **Create links** to organise your web by *your associations* *(🚧 in development)*
 - 📡 **Publish** your personal web on the world wide web *(🚧 in development)*

Because a row of dozens of tabs or bookmarks needs better organisation.

Because our minds organise by assocation, not by folders or filetypes.

Because browsers were never intended to be just *viewers*.

Let's make web browsers the *web weavers* they ought to be.


## Approach

This extension attempts to turn the browser into an offline-first knowledge management tool. It can
store web pages you visit on your computer by 'freeze-drying' them: removing scripts and thus most
interactive behaviour, but inlining all images and stylesheets to let you save the page exactly the
way you saw it.

The next step is to enable you to edit the pages, create new pages, and make links between them, to
really grow your personal web. Then, by synchronising your web with a server (possibly your own
server), you will be able to publish (parts of) it to share your knowledge with others.


## Contribute

Got feedback, bug fixes, new features, tips? Want to help with coding, design, or communication?
Give a shout. 📢

Pop in on #webmemex on [Freenode], send a PR or open an issue on the [GitHub repo], or send me
([Gerben/Treora][Treora]) a message.

All code in this project is in the public domain, free from copyright restrictions. Please waive
your copyrights on any contributions you make. See e.g. [unlicense.org] for more information.


[Freenode]: http://webchat.freenode.net/
[GitHub repo]: https://github.com/WebMemex/webmemex-extension
[Treora]: https://github.com/Treora
[unlicense.org]: https://unlicense.org/


## Hacking

See [`Codetour.md`](Codetour.md) for an explanation of the repository structure. In short, it is a
[WebExtension] (runs on Firefox and Chrome/Chromium browsers), bundled by [browserify] with some
[babel] ES6–7→ES5 compilation, that logs and stores pages in [PouchDB], and provides a viewer for
this personal web based on [React]+[Redux].

### Build and run it

1. Clone this repo.
2. Get [Node/NPM] and [yarn] (`npm install -g yarn`).
3. Run `make` to install dependencies and compile the source files.
4. Load it in Firefox or Chromium/Chrome:
    * In Firefox (≥49): run `npm run firefox` (or run [web-ext] directly for more control).
      Alternatively, go to `about:debugging`, choose 'Load Temporary Add-on', and pick
      `extension/manifest.json` from this repo.
    * In Chromium/Chrome: go to Tools→Extensions (`chrome://extensions`), enable 'Developer mode',
      click 'Load unpacked extension...', and pick the `extension/` folder from this repo.

### Automatic recompilation

If the steps above worked, running `npm run watch` will trigger a quick recompilation every time a
source file has been modified.

If you are testing in Firefox through `npm run firefox`/`web-ext`, the extension should also reload
automatically. Otherwise, manually press the reload button in the extension list.


[WebExtension]: https://developer.mozilla.org/en-US/Add-ons/WebExtensions
[browserify]: http://browserify.org
[babel]: https://babeljs.io
[PouchDB]: https://pouchdb.com
[React]: https://facebook.github.io/react/
[Redux]: http://redux.js.org/
[Node/NPM]: https://nodejs.org
[yarn]: https://yarnpkg.com
[web-ext]: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/web-ext_command_reference#web-ext_run
