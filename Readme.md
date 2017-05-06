# WebMemex browser extension

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

As it stands now, it is a WebExtension (thus should soon work on most modern
browsers), bundled by [browserify](http://browserify.org) with some
[babel](https://babeljs.io) ES6–7→ES5 compilation, that logs and stores visited
pages in [PouchDB](https://pouchdb.com), and provides a viewer for this data
based on
[React](https://facebook.github.io/react/)+[Redux](http://redux.js.org/).

The project strategy is to combine and integrate features from other projects,
and to factor out developed functionality into separate modules wherever it
seems sensible. This extension could then be regarded as a bunch of different
(but related) features a browser ought to have, bundled together for quick
installation.

See [our initial blog post](https://blog.webmemex.org/2017/01/05/roadmap/)
for the current feature roadmap.


## Contribute

Got feedback, bug fixes, new features, tips? Give a shout. :loudspeaker:

Pop in on #webmemex on [Freenode](http://webchat.freenode.net/), send a PR or
open an issue [on GitHub](https://github.com/Treora/memextension), or send
me ([Gerben](https://github.com/Treora)) a message.

Coding, design, communication, there is plenty to be done. A tiny but of funding
is available to tip significant contributions. :money_with_wings:

All code in this project is in the public domain, free from copyright
restrictions. Please waive your copyrights on any contributions you make.
See e.g. [unlicense.org](http://unlicense.org/) for more information.

## Hacking

Like playing with ES6, WebExtension browser APIs, React, Redux, PouchDB? Come
play along! :tada:

See [`Codetour.md`](Codetour.md) for an explanation of the repository structure.

### Build and run it

1. Clone this repo.
2. Get [Node/NPM](https://nodejs.org).
3. Run `make` to compile the source files.
4. Load it in Firefox or Chromium/Chrome:
    * In Firefox (≥49): run `make fx-run` (or run [web-ext](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/web-ext_command_reference#web-ext_run)
      directly for more control).
      Alternatively, go to [`about:debugging`](about:debugging), choose 'Load
      Temporary Add-on', and pick `extension/manifest.json` from this repo.
    * In Chromium/Chrome: go to [Tools→Extensions](chrome://extensions/), enable
      'Developer mode', 'Load unpacked extension...', pick the `extension/`
      folder from this repo.
    * Others browsers: let know if you have tested it!

### Automatic recompilation

If the steps above worked, running `make watch` will trigger a quick
recompilation every time a source file has been modified. It will also trigger a lint watch which will catch all the styling errors in the code.

If you are testing in Firefox through `make fx-run`/`web-ext`, the extension
should also reload automatically. Otherwise, depending on which part of the code
you change, you may have to reload the extension in your browser:

- If your edits affected only the overview interface, just refresh/reopen it.
- However, if you changed the background script, you have will to reload the
  extension: find it back in the list of temporary add-ons/extensions and click
  Reload.
- If you changed the 'content_script', it seems browser-dependent whether newly
  opened pages will get the new version. Better reload the extension to be sure.

### Guidelines for Contribution

Please follow the given guideline to make it easier for the maintainer to review and evaluate your work.

**NOTE:** By sending a pull request you willingly waive all your copyrights on the code, so that it can be published in the public domain. For further information look into [Unlicense](http://unlicense.org/)

* It is recommended that the developers use a text editor that supports editor config files and linting using eslint for consistent spacing and other code styling.

* Before taking on an issue please outline your approach in the corresponding issue. This way we can pool all of our ideas and come up with the best solution together.

* Before sending a pull request, make sure the code conforms to the styling guide. You can check for errors in styling by running the command ```npm run lint```. For trivial error fixes it is recommended that you use ```npm run lint-fix```. For EACCES errors please refer to [fixing npm permissions](https://docs.npmjs.com/getting-started/fixing-npm-permissions)

* Remove all errors and and fix the code styling before sending a pull request. Please also update the README.md with details of changes i.e. new environment variables, exposed ports, useful file locations and container parameters.

* We have a lot to do, so it might take a bit until a maintainer will review the code. We try our best to get it integrated ASAP.
