# Current iterative refactoring of the codebase

This document details the ongoing refactoring efforts, along with potential issues to be taken into account for future refactoring.

## Remote Functions Refactor

### Overview

Remote functions exist to enable background->tab, and tab->background function delegation (i.e. Call a function in a tab, but have it run in the background and vice versa).

Refactoring has been started to make these functions interfaced and type safe.

### Prior understanding and existing system

Following the format of browser extensions, Memex exists as scripts that are run in pages on tabs (`content_script.js`), and the parts that run in an 'invisible tab' in the background outside of any page (`background.js`).

To communicate between code on a page and code outside the page, a custom RPC wrapper is setup (`src/util/webextensionRPC.ts`) around the native WebExt API which enables extensions to communicate across scripts.

Currently, code is structured so that functions that are intended to be run in the background script, are passed into the function `makeRemotelyCallable`, which registers the given function name in a variable `remotelyCallableFunctions`, responsible for looking these functions up.

This variable referencing functions that can be run in the background is referenced by `incomingRPCListener` setup to run on the browser.runtime (the background extension script) with `browser.runtime.onMessage.addListener(incomingRPCListener)`

Background script functionality commonly resides in `/src/{feature}/background/index.js` and they are registered from `src/background.js`

An example of how this works is as follows:

The extension starts it's background page, registering these background functions, one of which is done by calling `makeRemotelyCallable({funcA})`, where `funcA` is a function imported from somewhere, e.g. `const funcA = (arg1,arg2) => { return 'done'}`.

At some point from the content script run in a page, that `funcA` is called but is run not in the content script that calls it, but in the background script, by: `const result = await remoteFunction('funcA')('1','2')`.

Further functionality: These `remoteFunction` calls also support running functions the other way around too. If called instead with `const result = await remoteFunction('FuncA',{tabId: 2})()` the function `funcA` will actually be run in the script on the page indicated by `tabId`. This is used for example, when needing to extract content on the page, by functionality that is running in the background script.

### New system

To assist the incremental refactoring, the old functions `makeRemotelyCallable` and `remoteFunction` still exist but should be considered depreciated. Their new typesafe versions are `makeRemotelyCallableType` and `runInBackground`. (we can rename `makeRemotelyCallableType` back to `makeRemotelyCallable` if desired once all refactoring has been done).

The `runInBackground<T>` function returns a typed proxy object. Requests for a property (including a method) on that proxy, actually call a remote function, so calls to

```
const examples = runInBackground<ExampleInterface>({example1: () => false,example2:() => false);
const result = await example.example1()
```

will actually call `remoteFunction('example1')()` under the hood.

### Work description

Refactor these remote functions to be type safe. Including the setup of these functions (`makeRemotelyCallable`) and the client usage of these functions (`remoteFunction`).

### Methodology

-   Identify a set of remote function registrations from the TODO list below.

-   Create an interface that describes the functions, arguments and returns, or a set thereof, e.g. `NotificationInterface`. Interfaces should be defined in a standalone types file or inside an existing standalone file with only types, so that when importing this interface, it doesn't import the functionality too, and remains lightweight.

-   Modify where it is setup via `makeRemotelyCallable` to use `makeRemotelyCallableType<T>` where `T` is this newly created interface.

-   Move the registration of this remote function to alongside the others in `src/background.js`

-   Search through all usages of this function from `remoteFunction`.
    (N.B. usage may not be directly done using a string literal e.g. `remoteFunction('exampleFunc')`, it may be using a variable, e.g. `const func = 'exampleFunc'; remoteFunction(func)`).

        -   Change usages to `runInBackground<T>` where `T` is this newly created interface.

        -   Change the usages to not each call `runInBackground` to create the function directly, but rather import from `src/util/remote-functions-background.ts`. Using the created proxy object (returned from `runInBackground`) transparently as if it were a concrete implementation. e.g. instead of calling `runInBackground('addBookmark')(args)` from within some feature's functionality, it uses `bookmarks.addBookmark(args)` where `bookmarks` is assigned to the created proxy object in `remote-functions-background.ts`, in the same manner the others are.

-   Test

-   Update this documentation with progress and any inconsistencies found.

-   Commit regularly

### Done so far:

src/background.ts

```typescript
makeRemotelyCallableType<NotificationInterface>({
   createNotification: ...
})
```

```typescript
makeRemotelyCallableType<BookmarksInterface>({
    addPageBookmark: ...,
    delPageBookmark: ...,
})
```

src/content-tooltip/interactions.ts:132

```typescript
makeRemotelyCallableType<TooltipInteractionInterface>({
    showContentTooltip: ...,
    insertTooltip: ...,
    removeTooltip: ...,
    insertOrRemoveTooltip: ...,
})
```

src/sidebar-overlay/content_script/ribbon-interactions.ts

```typescript
makeRemotelyCallableType<RibbonInteractionsInterface>({
    insertRibbon: ...
    removeRibbon: ...
    insertOrRemoveRibbon: ...
    updateRibbon: ...,
})
```

Along with all the associated client side calls, now using `runInTab` or `runInBackground` respectively.

e.g. `await runInTab<RibbonInteractionsInterface>(tabId).insertRibbon()`

### TODO:

Change the setup and usages of the following functions, following the outlined methodology and updating this document with progress.

```typescript
makeRemotelyCallable(isURLBlacklisted, addToBlacklist)
```

```typescript
makeRemotelyCallable(trackEvent, updateLastActive)
```

```typescript
makeRemotelyCallable(dirtyEstsCache)
```

```typescript
makeRemotelyCallable(
    storeNotification,
    fetchUnreadCount,
    fetchUnreadNotifications,
    fetchReadNotifications,
    readNotification,
    fetchNotifById,
    dispatchNotification,
)
```

```typescript
makeRemotelyCallable(
    addTweet,
    addPostToList,
    delPostFromList,
    fetchSocialPostLists,
    delSocialPages,
    addSocialBookmark,
    delSocialBookmark,
    addTagForTweet,
    delTagForTweet,
    fetchSocialPostTags,
    fetchUserSuggestions,
    fetchAllUsers,
    fetchAllHashtags,
    fetchHashtagSuggestions,
)
```

```typescript
makeRemotelyCallable(
    createDirectLink,
    getAllAnnotationsByUrl,
    createAnnotation,
    editAnnotation,
    editAnnotationTags,
    deleteAnnotation,
    getAnnotationTags,
    addAnnotationTag,
    delAnnotationTag,
    followAnnotationRequest,
    toggleSidebarOverlay,
    toggleAnnotBookmark,
    insertAnnotToList,
    removeAnnotFromList,
    goToAnnotationFromSidebar,
)
```

```typescript
makeRemotelyCallable(toggleLoggingPause, fetchTab, fetchTabByUrl)
```

```typescript
makeRemotelyCallable(
    search,
    addPageTag,
    delPageTag,
    suggest,
    extendedSuggest,
    delPages,
    fetchPageTags,
    delPagesByDomain,
    delPagesByPattern,
    getMatchingPageCount,
    searchAnnotations,
    searchPages,
    searchSocial,
)
```

```typescript
makeRemotelyCallable(
    storeEvent,
    getLatestTimeWithCount,
    trackEvent,
    processEvent,
)
```

```typescript
makeRemotelyCallable(
    createCustomList,
    insertPageToList,
    updateListName,
    removeList,
    removePageFromList,
    fetchAllLists,
    fetchListById,
    fetchListPagesByUrl,
    fetchListNameSuggestions,
    fetchListPagesById,
    fetchListIgnoreCase,
    addOpenTabsToList,
    removeOpenTabsFromList,
)
```

```typescript
makeRemotelyCallable(addTag, delTag, addTagsToOpenTabs, delTagsFromOpenTabs)
```

```typescript
makeRemotelyCallable(
    getBackupProviderLoginLink,
    startBackup,
    initRestoreProcedure,
    getBackupInfo,
    pauseBackup,
    resumeBackup,
    cancelBackup,
    startRestore,
    getRestoreInfo,
    pauseRestore,
    resumeRestore,
    cancelRestore,
    hasInitialBackup,
    setBackendLocation,
    getBackendLocation,
    isBackupBackendAuthenticated,
    maybeCheckAutomaticBakupEnabled,
    checkAutomaticBackupEnabled,
    isAutomaticBackupEnabled,
    sendNotification,
    estimateInitialBackupSize,
    setBackupBlobs,
    getBackupTimes,
    forgetAllChanges,
    setupRequestInterceptor,
)
```

```typescript
makeRemotelyCallable(openOverviewTab, openOptionsTab, openLearnMoreTab)
```

---

## Legacy 'search' namespace

All the stuff in `src/search/search`, and most of those loose modules in `src/search` (like `src/search/bookmarks` and `src/search/add`), are all legacy parts of the codebase that we’re aiming to eventually refactor out in top-level feature modules (like `src/backup`, `src/custom-lists`, etc) which limit the DB interaction to those `StorageModule` classes.

## `trackEvent` - two registrations

RPC Function trackEvent is defined in `src/analytics/background/index.js:10` which uses `=> analytics.trackEvent` from the `const analytics: Analytics = new AnalyticsManager({ backend })` exported at `src/analytics/index.ts:24`

but `trackEvent` is also defined in `src/analytics/internal/background/index.js:11` which uses `=>`sendToServer.trackEvent`from`src/analytics/internal/send-to-server/send-to-server.js:109`

This latter definition seems to be registered last so seems to be the one that will be used.

Q: What is the difference between `src/analytics/...` and `src/analytics/internal/...` anyway ? Can we remove the first track event system? How are they used?

## Bookmarks - two systems

There are currently two codepaths for bookmarking (starring) a page.

The Class `BookmarksBackground` exposes the remote function `addBookmark` and calls the method by the same name on the underlying storage `BookmarksStorage` at `src/bookmarks/background/storage.ts:4`
This seems to be part of a refactor to newer style of feature organisation and Storage management.
This was only used from search results, and thus does not contain any code for indexing or creating the page.

The other codepath for bookmarks is `addBookmark` in `src/search/bookmarks.ts:8` registered as `addPageBookmark`
This does handle indexing and page creation.

-   Done: with the remoteFunction refactoring, usages of the remote function `addBookmark` have been changed to `addPageBookmark` such that bookmarking from either a tab or the search result dashboard, uses the same bookmarking code.

-   TODO: Refactor this current `src/search/bookmarks.ts` code in the legacy `src/search/` namespace to this format of the now unused but newer designed `BookmarksBackground`. Retaining the page indexing code.

## Notifications - two systems

`src/util/notif*` should exist somewhere else as it's not a util, but browser interface abstraction. Probably in src/notifications/ somewhere.

There seems to be duplication between the usage of this directly, via the `createNotification` RPC call, usage via the `dispatchNotification` RPC call, and imported directly often as 'createNotif' :

`createNotification` is often imported directly as `createNotif` e.g.
`import createNotif from 'src/util/notifications'`

`dispatchNotification` seems written in the newer style so it seems everything should be moved to that

## Running in Tabs

Move everything that has to do with tabs to something like src/ipc or src/rpc.

## Misc
