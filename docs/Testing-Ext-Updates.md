# Manually Testing Extension Updates

You can simulate an extension updates (i.e., trigger the [`runtime.onInstalled` event](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onInstalled), restart scripts, keep DB state intact, etc.)
fairly easily with dev builds in **Chrome** (Firefox-specific instructions are welcome).

This assumes you have two branches/commits `A` and `B` and you are performing the update from a build of `A` to a build of `B`.

1. `git checkout A`
2. run `yarn build` to do a dev build
3. install build via `chrome://extensions` per usual
4. _do some stuff (play around, index some data, etc.)_
5. `git checkout B`
6. run `yarn build` to do another dev build
7. click the "refresh"-looking button in the installed Memex ext card in `chrome://extensions`

Rather than only refreshing/restarting the extension scripts, step 7 actually triggers all the stuff
that happens during an actual extension update, hence Memex's [install and update hooks](../src/background-script/on-install-hooks.ts)
will be run.
