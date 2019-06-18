## Existing bookmark functionality

(accurate at the time of d8a5fdf9156c5e5afa5eb6f86a7678b3e505c060)

### Remote function:

-   The Class `BookmarksBackground` exposes the remote function `addBookmark` and calls the method by the same name on the underlying storage `BookmarksStorage` at `src/bookmarks/background/storage.ts:4`

### Remote function usage:

1.  Remote Function call, with only url

        In `src/overview/results/actions.ts:95` as

    `bookmarkRPC({ url })`

2.  Remote Function call, with tabId

-   `src/popup/bookmark-button/actions.ts:23` as
    `bookmarkRPC({ url, tabId })`

        in a created `toggleBookmark` Thunk

    which is dispatched in `src/common-ui/components/annotation-list.tsx:212` and `src/sidebar-overlay/sidebar/components/sidebar-container.tsx:191`

**But: tabId is not accepted by the underlying background function here** (`src/bookmarks/background/index.ts`)

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

    ```typescript
    if (page == null || page.isStub) {
        page = await createPageViaBmTagActs(getDb)({ url, tabId })
    }
    ```

    The reason it accepts a `tabId` is so that it can use that to get a handle on the content of that page.

    I suppose doing this rather than relying on tab urls provides some safety over edge cases where urls are masked or duplicated but tab instances show different content, like e.g. multiple tabs for the same site/app containing different news feed items (different time, or non-deterministic content).
    (this makes sense for annotation where text can be different, but maybe overkill for tags? although I suppose it's the full text indexing that's important)

## Proposals / Questions

-   The file `src/search/bookmarks.ts` containing the `addBookmark` function could be moved to `src/search/background/bookmarks.ts` to better indicate that it is only used in the background.

-   Perhaps it could be better organised still, and the `src/search/..` folder namespace suggesting a `Search` feature could maybe instead be `src/browserapi/background/bookmarks.ts`?

-Q: in 2) there seems to be a typo or a bug in `bookmarkRPC({ url, tabId })`, is `tabId` supposed to be omitted, or is it supposed to have been provided instead in the underlying `remoteFunction('addBookmark',{tabId})` to create it? e.g. is this function supposed to run in a tab's content script or in the background.

-   Q: If the browser API events to `addBookmark` are also concerned with page creation and indexing, but the RPC function calls to `addBookmark` only use the `BookmarksStorage` to add the bookmark to the bookmarks collection, How is page creation / indexing done in these cases of using the RPC `addBookmark` ?

-   If possible, we could unify the code between these cases.
