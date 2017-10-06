### <a id="worldbrain" href="#worldbrain">WorldBrain</a>

Worldbrain is a browser extension that lets you create and search through your whole web of personal browser history.
 
 - **Store and Index** all the content of every web page you visit. 
 - **Full-Text-Search** all pages and bookmarks you have visited.
 - **Full Data Privacy** everything stays on your own computer and will **never ever ever EVER** be shared or used without your consent. Here at worldbrain we are highly concerned about your privacy and security please see our [privacy policy](**TODO**) for more details. 

Lookout for these exiting new features in the future:
 - **Rate** webpages you visit, add notes, comments and links to similar valuable resources
 - **Weight** intelligent algorithims to assess the value of a webpage based on your interactions with it. 
 - **Integrate** with all your favorite services such as facebook, evernote and twitter 
 - **Share** recommendations, comments, links & ratings with your network.
 - **Discover** find new content that has high value within your network
 - **Diversify** the content you find by looking through great sources on the opposite side of your 'value' system. Break out of your 'filter bubble' 

### Table Of Content

1. [Project Status](#project-status)
1. [Contributing](#contributing)
    * [Getting Started](#getting-started)
    * [Installation](#installation)
    * [Running The Extension](#running-the-extension)
1. [Code Overview](#code-overview)
    * [A brief overview of Web Extensions](#a-brief-overview-of-web-e)
    * [Application Structure](#application-structure)
    * [Dependencies](#dependencies)
1. [Contact](#contact)
1. [See also](#see-also)

### <a id="project-status" href="#project-status">Project Status</a>
We are currently on the cusp of releasing a brand new version of the extension. See [roadmap][**TODO**] for more details

The old one can still be found here: worldbrain.io/download

Want to help out? If you are:
 - A Developer
 - A Marketer
 - A Designer
 - An Investor
 - Or want to donate a bit of money
 
**Please see [Contributing!](#Contributing)**

Have questions?
- [Feedback](#Contact), how can we make our extension better?
- [General Questions or Concerns](#Contact)
- [Feature Requests](**TODO**), vote for or add any new features you may want to see!
- [Bugs or Issues](https://github.com/WorldBrain/Research-Engine/issues/new), is something broken or not working as you feel it should?


### <a id="contributing" href="#contributing">Contributing</a>
**If you are a Developer head to [Getting Started](#GettingStarted)**

**If you are a Designer, Marketer, or Investor**
    Please Email Oliver Sauter: oli@worldbrain.io 
    
**If you would like to donate a bit of money**
Please support us on [Patreon](https://www.patreon.com/WorldBrain)

### <a id="getting-started" href="#getting-started">Getting Started</a>

We have broken up tasks into three levels, **easy**, **medium** and **hard** tasks. You can choose based on your skill level or how much time you would like to put into contributing. You can also check out [Issues](issues) to see what bugs need to be squashed. **After finding a Task you would like to help out with please see [Installation Instructions](#Installation)**.   

### Easy
**TODO**
### Medium
**TODO**
### Hard
**TODO**

### <a id="installation" href="#installation">Installation</a>

**This assumes a basic knowledge of `git`, `npm` and usage of the `command line`, if you are uncomfortable with these tools please see *[the basics]***

### First steps:
**Clone this repo:**

```sh
$ git clone https://github.com/WorldBrain/WebMemex
```

**Install yarn:** 
```sh
$ npm install -g yarn
```

**Run `yarn` to install dependencies**
```sh
$ yarn
```
**This could take a while....**

**Now run `yarn watch` to compile incremental builds**
```sh
$ yarn watch
```

**For Windows Users! Please run: **TODO**** 
```sh
$ yarn watch **TODO**
```

### <a id="running-the-extension" href="#running-the-extension">Running The Extension:</a>

As of now it should work in most modern browsers except Safari (we mainly use [Chrome](#Chrome) for testing so if any inconsistencies are found in [Firefox](#Firefox), Opera or any other browser please create an [issue][issue] and submit a fix)

**Note: It is highly recommended to [create a new user](#Creatinganewuser) for dev purposes especially if you currently use the extension and would like to develop without interfering in it's daily use**

### Creating a New User
*Chrome:*
1. In the top right corner of your browser click the user icon (above the menu). Alternatively go into [settings](chrome://settings/)
2. Now click **Manage People**, in settings: Under *People* click **Manage other people**
3. Now click **Add People** in the lower left
4. Choose a name such as **Worldbrain Test** and any icon. 
5. All Finished! :tada:

*Firefox:*
1. In firefox url type in [about:profiles](about:profiles)
2. Click `Create a new Profile`
3. Hit `continue`
4. Now enter a name such as **Worldbrain Test** and hit `continue`
5. You should see the new Profile and can now click `Launch profile in new browser`
6. All Finished! :tada: For more info see: [creating multiple profiles](https://developer.mozilla.org/en-US/Firefox/Multiple_profiles)

### Running + Debugging
*Chrome*
1. Open a `New Tab`
2. Click on the `Menu`
3. Go to `More Tools`
4. Click `Extensions`
5. At this point it is reccomended to bookmark `Extensions` for ease of use in development
6. Click `Load unpacked extension...` 
7. Now navigate to the folder where you cloned the repo and there should be a new folder named extension (this was created by [`yarn watch`]) go into this folder then click `select this folder`
8. Everything should be all loaded! 😃
9. To view developer tools go to the [Extension Page](chrome://extensions/) and under *inspect views:* click `background page`

*Firefox*
1. Enter [about:debugging](about:debugging) into the url 
2. Check the `Enable add-on debugging` box
3. Click `Load Temporary Add-on`
4. Now navigate to the folder where you cloned the repo and there should be a new folder named extension (this was created by [`yarn watch`]) go into this folder select the `manifest.json` file and then click `open`
5. Everything should be all loaded! 😃
6. To view the developer tools simply click `Debug` under the Worldbrain Extension in [about:debugging](about:debugging)

**Now you are ready to hack! 😃** 
We reccomend reading through the [Code Overview](#CodeOverview) to get an idea of how the extension works 


### <a id="code-overview" href="#code-overview">Code Overview</a>

### <a id="a-brief-overview-of-web-e" href="#a-brief-overview-of-web-e">A brief overview of Web Extensions</a>

A web extension consists of three main parts:

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

Besides these parts:
[`browser-polyfill.js`](https://github.com/mozilla/webextension-polyfill/)
provides the promise-based `browser` API, that simply wraps Chromium/Chrome's
callback-based `chrome` API, in order to make the same code run in different
browsers (and to structure the callback mess).

**For more info please see [Anatomy of a WebExtension](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Anatomy_of_a_WebExtension)**

### <a id="application-structure" href="#application-structure">Application Structure</a>
To keep things modular, the source code in [`src/`](src/) is split into folders which are grouped by functionality. They can almost be thought of as separate libraries and some folders may end up being factored out into their own repos later on. 

#### **[src/blacklist/](src/blacklist/)**: blacklist

This allows a user to stop and/or delete the index/logging of specific domains or pages they visit.

#### **[src/common-ui/components](src/common-ui/components)**: ui elements

This contains common user interface elements such as the loading indicator. 

#### **[src/dev/](src/dev/)**: development tools

Tools to help during development. They are not used in production builds.

#### **[src/imports/](src/imports/)**: browser history import

This allows users to import their whole browser history however, due to slow speeds and multiple setbacks it has been deprecated and may only be kept on as a dev tool to import test docs. 

Instead of using a browser this module is set to move to a native Desktop Apllication see [roadmap][roadmap] for more details

#### **[src/options](src/options/)**: the settings page

This shows the settings page of the extension which includes (for the time being)
 - Blacklist
 - Acknowledgements 
 - Privacy
 - Help Me Please

#### **[src/overview/](src/overview/)**: overview

The `overview` is a user interface that opens in its own tab. It shows a 'facebook newsfeed' like page that lists random pages you have visited. It also provides tools for more advanced search options and a complete search overview with screenshots. It is built with [React](https://facebook.github.io/react/) and [Redux](http://redux.js.org/).

See [The Docs](src/overview/Readme.md) for more details.

#### **[src/page-analysis](src/page-analysis/)**: page analysis

This extracts and stores information about the page in a given tab, such as:
- The plain text of the page, mainly for the full-text
search index.
- Metadata, such as its author, publication date, etc...
- A screenshot for visual recognition.

See [The Docs](src/page-analysis/Readme.md) for more details.

#### **[src/page-storage](src/page-storage/)**: document search

This runs through each page to store and makes sure there isn't a duplicate and prepares it for use in our data model 

See [The Docs](src/page-storage/Readme.md) for more details.

#### **[src/popup](src/popup/)**: extension popup

The `popup` is a mini UI that pops up when you click on the worldbrain. It contains
- search
- pause
- settings
- feedback

See [The Docs](src/popup/Readme.md) for more details.

#### **[src/search](src/search/)**: document search

This provides a **Full-Text-Search** through all the web pages a user visits. 

See [The Docs](src/search/Readme.md) for more details.

#### **[src/util/](src/util)**: utilities

Contains small generic things, stuff that is not project-specific. Things that
could perhaps be packaged and published as a NPM modules some day.
See [The Docs](src/util/Readme.md) for more details.

#### **[src/background.js](src/background.js)**: WebExtension background script

This provides a wrapper for all the process run in the background which sit in an empty tab listening for events.
It contains the functions to:
 - `getAttatchments`
 - `createNewPageForBookmark`
 - `openOverview`

See [A brief overview of web extensions](#AbriefoverviewofWebExtensions) for more details.

#### **[src/content_script.js](src/content-script.js)**: A Part of Web Extensions

This just wraps the content scripts of activity-logger and page analysis for use as a [Web Extension](#AbriefoverviewofWebExtensions).

#### **[src/omnibar.js](src/omnibar.js)**: Search-Bar Controls

Allows a user to type `w` + `space_bar` to search through worldbrain without leaving the searchbar. 

See (Mozilla Omnibox Docs)[https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/omnibox] for more details

#### **[src/pouchdb.js](src/omnibar.js)**: Our Persistent Browser Database

This initializes the user database using [PouchDB]()

#### **...**: other stuff

The build process is based on `yarn`, that runs some `npm` commands specified in
`package.json`, which in turn start the corresponding tasks in
`gulpfile.babel.js` (transpiled by settings in `.babelrc`).


### <a id="dependencies" href="#dependencies">Dependencies</a>

- [react](https://reactjs.org/) - A  Javascript component based 'framework' (it's actually a library) used for the User Interface
- [react-redux](https://github.com/reactjs/react-redux) - A global state handler that syncs with react to create a nice workflow.
- [babel](https://babeljs.io/) - This is used for compiling ES7=>6=>5
- [browserify](http://browserify.org/) - Combined with babel allows us to bundle up our dependencies using the `import 'module'` syntax 
- [gulp](https://gulpjs.com/) - Combined with browserify + babel this gives us the ability to listen to any saved changes in our code and automatically compile it for use in a Browser Extension 

### <a id="contact" href="#contact">Contact</a>

#### Feedback
**How can we make our extension better?**
Please email @swissums: yager@worldbrain.io
or
Join our slack channel: https://join-worldbrain.herokuapp.com/ and post a message

#### General Questions or Concerns?
**Contemplating the meaning of life?**
**Wondering why we are so wonderful or how we do what we do?**
**Concerned that your Grandma may not understand how the extension works?**

Please email @oliversauter: oli@worldbrain.io
or
Join our slack channel: https://join-worldbrain.herokuapp.com/ and post a message

#### Feature Requests
**Request, Vote and Comment on any new features you may want to see!**

Please visit our [Feature Requests Page](**TODO**)


#### Bugs and Issues 
**Is the extension acting funny?**
**Something not working properly or seems off?**

Please Create a new [Issue](https://github.com/WorldBrain/Research-Engine/issues/new)

### <a id="see-also" href="#see-also">See also</a>

External resources

* [Sign in to GitHub · GitHub - github.com](https://github.com/WorldBrain/Research-Engine/issues/new)
* [WorldBrain is creating a structural solution to online (scientific) misinformation  - www.patreon.com](https://www.patreon.com/WorldBrain)
* [GitHub - WorldBrain/WebMemex: The refactored version of the (Re)search-Engine - github.com](https://github.com/WorldBrain/WebMemex)
* [Multiple Firefox profiles - Mozilla  - developer.mozilla.org](https://developer.mozilla.org/en-US/Firefox/Multiple_profiles)
* [GitHub - mozilla/webextension-polyfill: A lightweight polyfill library for Promise-based WebExtension APIs in Chrome - github.com](https://github.com/mozilla/webextension-polyfill/)
* [Anatomy of an extension - Mozilla  - developer.mozilla.org](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Anatomy_of_a_WebExtension)
* [Read Me · Redux - redux.js.org](http://redux.js.org/)
* [omnibox - Mozilla  - developer.mozilla.org](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/omnibox)
* [ data-react-helmet="true">React - A JavaScript library for building user interfaces - reactjs.org](https://reactjs.org/)
* [GitHub - reactjs/react-redux: Official React bindings for Redux - github.com](https://github.com/reactjs/react-redux)
* [Babel · The compiler for writing next generation JavaScript - babeljs.io](https://babeljs.io/)
* [gulp.js - gulpjs.com](https://gulpjs.com/)
* [Join the WorldBrain community on Slack! - join-worldbrain.herokuapp.com](https://join-worldbrain.herokuapp.com/)


<!-- 
Broken links:
https://facebook.github.io/react/ (301 error)
-->