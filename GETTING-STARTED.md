# <a id="contributing" href="#contributing">Contributing</a>

Please be sure to familiarize yourself with our [coding guidelines](docs/Coding-Guidelines.md) before writing any code.
Note that lots of our existing codebase will not be following these guidelines well. All new code contributions should, however.

## Installation

**This assumes a basic knowledge of `git`, `npm` and usage of the `command line`.**

**Please ensure you are running on an environment using [a v10.x release of Node](https://nodejs.org/en/).** As of writing, this is currently Node [v10.17.0](https://nodejs.org/download/release/v10.17.0/).

Newer versions could result in a failing `yarn install` as they haven't been assessed just yet.

### First steps:

**Clone this repo:**

```sh
$ git clone https://github.com/WorldBrain/Memex
```

**Install yarn:**

We recommend intalling the latest stable version of Yarn by following the instructions specific to your operating system on the [Yarn
installation page](https://yarnpkg.com/en/docs/install).

**Run `yarn` to install dependencies**

in the cloned folder Memex run `yarn`, This could take a while....

```sh
$ yarn
```

**Clone [Storex](https://github.com/WorldBrain/storex) submodules that we depend on**

```sh
git submodule update --init --recursive
```

**Now run `yarn watch` to compile incremental builds**

```sh
$ yarn watch
```

**You can also enable optional OS build notifications in watch mode**

```sh
$ yarn watch:notif
```

Subsequent development builds are sped up via use of caching. If any odd side-effects are encountered
between builds, you can clear the cache to ensure your next build is completely fresh.

```sh
$ yarn cache:clean
```

## Running The Extension

As of now it should work in most modern browsers except Safari (we mainly use Chrome for testing so if any inconsistencies are found in Firefox, Opera or any other browser please create an [issue](https://github.com/WorldBrain/Memex/issues/new) and submit a fix)

**Note: It is highly recommended to [create a new browser profile](#creating-a-new-browser-profile) for dev purposes especially if you currently use the extension and would like to develop without interfering with its daily use**

### Creating a New Browser Profile

_Chrome:_

1.  In the top right corner of your browser click the user icon (above the menu). Alternatively go into [settings](chrome://settings/)
2.  Now click **Manage People**, in settings: Under _People_ click **Manage other people**
3.  Now click **Add People** in the lower left
4.  Choose a name such as **Worldbrain Test** and any icon.
5.  All Finished! :tada:

_Firefox:_

1.  In firefox url type in [about:profiles](about:profiles)
2.  Click `Create a new Profile`
3.  Hit `continue`
4.  Now enter a name such as **Worldbrain Test** and hit `continue`
5.  You should see the new Profile and can now click `Launch profile in new browser`
6.  All Finished! :tada: For more info see: [creating multiple profiles](https://developer.mozilla.org/en-US/Firefox/Multiple_profiles)

### Running + Debugging

_Chrome:_

1.  Open a `New Tab`
2.  Type [chrome://extensions](chrome://extensions) into the address bar
3.  At this point, it is recommended to bookmark `Extensions` for ease of use in development
4.  Check `developer mode` box
5.  Click `Load unpacked extension...`
6.  Now navigate to the folder where you cloned the repo and there should be a new folder named extension (this was created by [`yarn watch`]) go into this folder then click `select this folder`
7.  Everything should be all loaded! 😃
8.  To view developer tools go to the [Extension Page](chrome://extensions/) and under _inspect views:_ click `background page`

**Note:** This is only for debugging the [background scripts](#code-overview). [Content-Script](#code-overview]) works within the reg dev tools of any given tab and the [Options](#srcoptions-the-settings-page), [Overview](#srcoverview-overview) and [Popup](#srcpopup-extension-popup) UI dev tools can be accesed by `right click Inspect` on the given element.

_Firefox:_

1.  Enter [about:debugging](about:debugging) into the address bar
2.  Check the `Enable add-on debugging` box
3.  Click `Load Temporary Add-on`
4.  Now navigate to the folder where you cloned the repo and there should be a new folder named extension (this was created by [`yarn watch`]) go into this folder select the `manifest.json` file and then click `open`
5.  Everything should be all loaded! 😃
6.  To view the developer tools simply click `Debug` under the Worldbrain Extension in [about:debugging](about:debugging)

## Creating your own branches to work on

We recommend [creating a forked repo on your GitHub account](https://help.github.com/articles/fork-a-repo/),
which you can create branches to push your commits to, and easily keep up-to-date with our
upstream changes.

**Clone your forked repo:**

```sh
$ git clone https://github.com/${GH_USERNAME}/Memex
```

**Add & fetch our repo as a remote named `upstream`:**

```sh
$ git remote add -f upstream https://github.com/WorldBrain/Memex
```

**Create and move to a new local branch based on our current `develop` branch:**

```sh
$ git checkout -b ${BRANCH_NAME} upstream/develop
```

_...have a play around..._

**Publish and push your local branch to your forked repo:**

```sh
$ git push -u origin ${BRANCH_NAME}
```

From there, you can make Pull Requests from your pushed branches to any `feature/*` branches on our Memex repo
via your forked repository on GitHub.

You can keep your forked repo's branches in-sync with our upstream changes. We recommend doing this before
making or requesting any reviews on PRs.

**Replay all your commits on top of our current `develop` branch:**

```sh
$ git pull --rebase upstream develop
```

**Overwrite your personal forked repo's branch with your synced local branch state:**

```sh
$ git push --force
```

Keep in-the-loop and chat with us on the Memex repo's [Issues](https://github.com/WorldBrain/Memex/issues) and
[PRs](https://github.com/WorldBrain/Memex/pulls) pages so we can work together on different parts of the
code.

**Now you are ready to hack! 😃**
We recommend reading through the [Code Overview](#code-overview) to get an idea of how the extension works and also looking @ [Submitting Changes](#submitting-changes) before making any pull requests.

## Managing dependencies

We currently use yarn and its lockfile to manage all of our main dependencies that are
available on either NPM or GitHub. Please use `yarn add $PACKAGE_NAME` to add any new
deps and properly update the lockfile (please don't manually attempt to update the lockfile).
Likewise, `yarn remove $PACKAGE_NAME` handles removal.

Please be aware that managing deps via the `npm` CLI tool will **not** update the lockfile.

For deps that aren't available on NPM or GitHub, these will require some more complicated form
of management. We will treat these on a case-by-case basis and discuss with the team.

## Documenting

We try to encourage documenting module exports using JSDoc with TypeScript, and also higher level overviews of different "feature modules" (directories containing multiple modules related to a particular feature) in README markdown modules.

If you have made changes to any exports in existing modules, please update the corresponding docs if needed.

If you are creating a new feature module, please add a brief overview in the way of a README in the corresponding directory.

## Naming conventions

Over the course of the Memex project's life, different naming conventions
for different files/modules have crept in. You'll see JS and TS modules often differing
in the naming conventions they are named with depending on the type of code they contain.

For all future contributions, we request that you please name any new JS/TS/CSS modules
using `kebab-case`.

We also ask that you postfix `-container` to any module name where the main export is
a React container component. There may be certain cases where this isn't as obvious or
appropriate though. Hopefully we can resolve that in the review stage.

## Styling

We are using [prettier](https://github.com/prettier/prettier).
This will automatically format all the styling for the code every time a commit is made, so you can focus on coding and not on code styling.

# <a id="code-overview" href="#code-overview">Code Overview</a>

## A brief overview of Web Extensions

A web extension consists of a number of different scripts:

-   `background.js` always runs, in an 'empty invisible tab', listening for
    messages and events.
-   `content_script.js` is loaded into every web page that is visited. It is
    invisible from that web page's own scripts, and can talk to the background script.
-   **User Interfaces**, The UI's are set up and declared in the `src/manifest.json` file. At the moment these consist of the popup and options scripts.

Certain modules in the source code will end up in each of these scripts after
being output from the build process, depending on the `import` trails throughout
different modules. Each script is completely distinct from any other script. The main thing this means is you **should not** `import` from a module in the one script from any module in another script, or you end up duplicating the all the modules specific to one script in multiple other scripts in the build output. This is the main reason for our [`util/webextensionRPC`](./src/util/webextensionRPC.ts) module:

We can setup remote functions (we sometimes call them "endpoints") with the `makeRemotelyCallable` export, then be able to remotely call them from other scripts with that `remoteFunction` export. This wraps around the WebExt [`runtime.sendMessage`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/sendMessage) and related messaging APIs which afford interscript communication. Generally we setup endpoints via `makeRemotelyCallable` from the BG script and call them from UI scripts via `remoteFunction`, although there's nothing stopping you from doing it the other way. It just generally makes a more sense to contain a lot of the business logic in the BG script (it acts somewhat like our "backend server", being the only place the DB is ever interacted with), and keep the UI scripts concerned solely with managing UI state and rendering views.

Besides these parts:
[`browser-polyfill.js`](https://github.com/mozilla/webextension-polyfill/)
provides support for the `WebExtension/BrowserExt API` in order to make the same code run in different browsers (and to structure the callback mess).

This API is available in Chrome/Chromium by default (under `window.chrome`) but is meant to be developed and standardized as it's own thing.

**For more info please see [Anatomy of a WebExtension](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Anatomy_of_a_WebExtension)**

## Application Structure

To keep things modular, the source code in [`src/`](./src/) is split into "feature modules"/directories which are grouped by functionality. They can almost be thought of as separate libraries and some features may end up being factored out into their own repos later on.

### Feature Structure

For new BG script features, these should go into the `background/` dirs of top-level (`src/`) feature modules.

An existing example top-level feature module is [`backup/`](src/backup-restore). You'll see `background/` and `content_script/` dirs in there containing BG script and content script logic related to that feature, respectively. The `backup/background/index` module acts as the BG script entrypoint for the backup feature, exporting a main class, `BackupBackgroundModule`, which accepts a few different args upon instantiation. Most important being `storageManager`; this allows access to the DB. The `BackupBackgroundModule` class has a lot of different methods to cover different feature behaviours, but all DB manipulation itself is done in another class in the `backup/background/storage` module.

Looking into that, you'll see it extends the abstract [`FeatureStorage` class](./src/search/storage/index.ts#L6-L19), which affords consistent set up to interact with the `storageManager` DB instance and set up new Storex ([our DB](https://github.com/WorldBrain/storex)) data collections.
Finally, all BG script features should be instantiated in the [BG script entrypoint module](./src/background.ts#L44).

_Note that many features do not yet use this structure. We intend to port over legacy code eventually, but all new BG feature code should be written in this way._

## Feature list

Note this may not be up-to-date and links may get broken as things change. Feel free to submit
a PR to fix anything you notice is broken, missing, or just doesn't make sense.

#### **[src/blacklist/](./src/blacklist/)**: blacklist

This allows a user to stop and/or delete the index/logging of specific domains or pages they visit.

#### **[src/common-ui/components](./src/common-ui/components)**: ui elements

This contains common user interface elements such as the loading indicator.

#### **[src/dev/](./src/dev/)**: development tools

Tools to help during development. They are not used in production builds.

#### **[src/imports/](./src/imports/)**: browser history import

This allows users to import their whole browser history, however, due to slow speeds and multiple setbacks it has been deprecated and may only be kept on as a dev tool to import test docs.

#### **[src/options](./src/options/)**: the settings page

This shows the settings page of the extension which includes (for the time being)

-   Blacklist
-   Acknowledgements
-   Privacy
-   Help Me Please

#### **[src/overview/](./src/overview/)**: overview

The `overview` is a user interface that opens in its own tab. It shows a 'facebook newsfeed' like page that lists random pages you have visited. It also provides tools for more advanced search options and a complete search overview with screenshots. It is built with [React](https://facebook.github.io/react/) and [Redux](http://redux.js.org/).

See [The Docs](./src/overview/Readme.md) for more details.

#### **[src/page-analysis](./src/page-analysis/)**: page analysis

This extracts and stores information about the page in a given tab, such as:

-   The plain text of the page, mainly for the full-text
    search index.
-   Metadata, such as its author, publication date, etc...
-   A screenshot for visual recognition.

See [The Docs](./src/page-analysis/Readme.md) for more details.

#### **[src/popup](./src/popup/)**: extension popup

The `popup` is a mini UI that pops up when you click on the worldbrain. It contains

-   search
-   pause
-   settings
-   feedback

See [The Docs](./src/popup/Readme.md) for more details.

#### **[src/search](./src/search/)**: document search

This provides a **Full-Text-Search** through all the web pages a user visits.

See [The Docs](./src/search/Readme.md) for more details.

#### **[src/util/](./src/util)**: utilities

Contains small generic things, stuff that is not project-specific. Things that
could perhaps be packaged and published as an NPM package some day.
See [The Docs](./src/util/Readme.md) for more details.

#### **[src/background.ts](./src/background.ts)**: WebExtension background script

This provides a wrapper for all the process run in the background which sits in an empty tab listening for events.

See [A brief overview of web extensions](#AbriefoverviewofWebExtensions) for more details.

#### **[src/content_script.js](./src/content_script.js)**: A Part of Web Extensions

This just wraps the content scripts of activity-logger and page analysis for use as a [Web Extension](#AbriefoverviewofWebExtensions).

#### **[src/omnibar.js](./src/omnibar.js)**: Search-Bar Controls

Allows a user to type `w` + `space_bar` to search through worldbrain without leaving the search bar.

See [Mozilla Omnibox Docs](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/omnibox) for more details

#### **[src/pouchdb.js](./src/omnibar.js)**: Our Persistent Browser Database

This initializes the user database using [PouchDB](https://pouchdb.com/)

## Dependencies

-   [react](https://reactjs.org/) - A Javascript component-based 'framework' (it's actually a library) used for the User Interface
-   [react-redux](https://github.com/reactjs/react-redux) - A global state handler that syncs with react to create a nice workflow.
-   [babel](https://babeljs.io/)
-   [webpack](https://webpack.js.org/)
