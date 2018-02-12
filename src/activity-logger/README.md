## `activity-logger` Feature Module

### Purpose

- logging a user's web page visit activity, interactions in each visit
- keep track of state related to visit activity per browser tab

### How it works

#### Background script:

Keeps all the tab state (includes data about ongoing visits) managed, using `tabs` API events.
The concept of visits comes into play with the `tabs.onUpdated` event, when a tab's URL is determined
to be updated - this marks the beginning of a new visit. Logic behind the visit consists of 3 main stages:

1. initial page stub indexing
2. delayed page content indexing (optional)
3. final visit interations indexing

Stage 1 consists of indexing the page title, URL, and domain, and indexing the associated visit.
This is done after the initial DOM is fully loaded. Note that the page data indexing can be skipped
if there is a recent visit to the same URL. In this case, stage 2 will also be skipped, but the visit
will be indexed.

Stage 2 consists of indexing the page text, favicon, screenshot, which is far more complex and space-consuming.
`page-storage` and `page-analysis` modules will be invoked in this process to extract this data from the browser tab.
This is done after the user has been active on the tab for at least 10s (managed by tabs state). Can be skipped.

Stage 3 consists of indexing the accumulated interaction data for this visit (tabs state). Data
includes active time on page and scroll states.
This is done when the user closes the tab or URL is determined to be changed (new visit).

#### Content script:

Simply handles deriving state from the `scroll` event on `window` and sending that to the background script.
The background script uses this data to derive scroll px/% at any given time and also keep track of the max
scroll along the y axis.
