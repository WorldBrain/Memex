## `imports` Feature Module

### Purpose

- converting browser history and bookmarks into import items
- managing and persisting import items state
- downloading and processing import items and sending results to `search-index` feature module
- afford external progress and choice controls

### How it works

#### Rough arch overview:

[source](https://docs.google.com/document/d/1hT3sSc_MaHdREilBoekOvJJMvGpRYWL_zAjK3lWu1sA/edit?usp=sharing)

![imports arch](imports-arch.png)

Imports is made up of a number of different modules with different responsibilities.

An instance of `ImportStateManager` acts as a singleton in the background script.
It acts as a cache of import items, which are persisted in dynamically allocated chunks
stored under local storage keys. It will interact with `ImportItemCreator` if the cache misses
to handle deriving new import items from the Web Ext `history` and `bookmarks` APIs, which it will
handle allocating local storage keys to chunks for.

An instance of `ImportConnectionHandler` will be created whenever the UI script creates a connection
(user first installs or goes to imports page). This will handle a number of special commands that
are sent over a [`runtime.connect()` connection](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/runtime/connect) to afford control over
imports progress and various options.

`ImportConnectionHandler` delegates control to `ImportProgressManager` to handle the
progress state (whether it is running, etc.), and iterating through chunks of import items
provided by the `ImportStateManager` instance when running. An array of `ImportItemProcessors`
are maintained - length will be equal to concurrency setting - to which import items within
the current chunk will be distributed: 1 item per processor. Once a chunk is depleted,
the next chunk will be requested from the cache. When all chunks are depleted, a "complete"
command will be sent to the UI and progress will end.

An instance of `ImportItemProcessor` handles processing import items. Processing includes
downloading of the page data at the given URL via [`fetch-page-data` module](https://github.com/WorldBrain/Memex/blob/master/src/page-analysis/background/fetch-page-data.js),
getting any visit or bookmark timestamps using the given browser ID, and sending
and waiting on a request to the search index to preprocess and index the data.

#### Import item shape

```ts
// History or bookmark (or old ext data - prob soon to be deprecated)
type ImportItemType = 'h' | 'b' | 'o';

interface ImportItem {
    type: ImportItemType; // Used for switching `ImportItemProcessor` logic
    browserId: number; // Used for visit times lookup (browser-tracked)
    url: string; // Will be used for download
}
```
