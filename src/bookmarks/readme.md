## Existing bookmark functionality

(accurate at the time of d8a5fdf9156c5e5afa5eb6f86a7678b3e505c060)

### Remote function:

-   The Class `BookmarksBackground` exposes the remote function `addBookmark` and calls the method by the same name on the underlying storage `BookmarksStorage` at `src/bookmarks/background/storage.ts:4`

This seems to be part of a refactor to newer style of feature organisation and Storage management.

It is currently un-used as previously, only the call to bookmark a search result was using it, which added another bookmark code path outside the main page bookmarking (`addPageBookmark`).

-   TODO: Ideally refactor the current `src/search/bookmarks.ts` in the legacy `src/search/` to this new organisation. Otherwise, remove this now un-used function.

### Remote function usage:

1.  Remote Function call, with only url

    In `src/overview/results/actions.ts:95` as `bookmarkRPC({ url })`

2.  Remote Function call, with tabId

    `src/popup/bookmark-button/actions.ts:23` as
    `bookmarkRPC({ url, tabId })` in a created `toggleBookmark` Thunk which is dispatched in `src/common-ui/components/annotation-list.tsx:212` and `src/sidebar-overlay/sidebar/components/sidebar-container.tsx:191`

### Other usage

3. Browser Bookmarks API, not using remote function, is already setup and used in the background.

-   `src/search/bookmarks.ts:8`

    There exists an `addBookmark` function.

    With sig `(getDb, tabMan) => ({url,timestamp,tabId}) => ...`  
     This seems to be an entirely different code path.

    Seems to support only the browser API for when a user uses the native browser bookmarking (to also do bookmarking in Memex)

    It is used by `src/search/background/index.ts:97`

    `this.backend.addBookmark = idx.addBookmark(this.getDb, this.tabMan)`

    That usage creates a new function (essentially, dependency injection)

    which is (only) used by
    `handleBookmarkCreation(id, node)` at `src/search/background/index.ts:240`

    Which is called as a listener to browser api based bookmarks add (e.g. toolbar)

    It creates the page if it doesn't exist, performing the indexing, sets that it's bookmarked, in the db, and the tag manager.

    The reason it accepts a `tabId` is so that it can use that to get a handle on the content of that page.

    I suppose doing this rather than relying on tab urls provides some safety over edge cases where urls are masked or duplicated but tab instances show different content, like e.g. multiple tabs for the same site/app containing different news feed items (different time, or non-deterministic content).
    (this makes sense for annotation where text can be different, but maybe overkill for tags? although I suppose it's the full text indexing that's important)
