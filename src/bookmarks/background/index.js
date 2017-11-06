import removeBookmarkByUrl from './deletion'
import { createBookmarkByExtension, createNewPageForBookmark } from './addition'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'

makeRemotelyCallable({ createBookmarkByExtension })
makeRemotelyCallable({ removeBookmarkByUrl })

const removeBookmarkHandler = (id, { node }) =>
    node.url
        ? removeBookmarkByUrl(node.url)
        : console.warn('Cannot remove bookmark with no URL', node)

// Store and index any new browser bookmark
browser.bookmarks.onCreated.addListener(createNewPageForBookmark)
browser.bookmarks.onRemoved.addListener(removeBookmarkHandler)
