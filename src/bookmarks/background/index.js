import removeBookmarkByUrl from './deletion'
import { createBookmarkByUrl, createNewPageForBookmark } from './addition'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'

makeRemotelyCallable({ createBookmarkByUrl })
makeRemotelyCallable({ removeBookmarkByUrl })

const removeBookmarkHandler = (id, { node }) =>
    node.url
        ? removeBookmarkByUrl(node.url, true)
        : console.warn('Cannot remove bookmark with no URL', node)

// Store and index any new browser bookmark
browser.bookmarks.onCreated.addListener(createNewPageForBookmark)
browser.bookmarks.onRemoved.addListener(removeBookmarkHandler)
