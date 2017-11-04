import removeBookmarkByUrl from './deletion'
import { createBookmarkByExtension, createNewPageForBookmark } from './addition'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'

makeRemotelyCallable({ createBookmarkByExtension })
makeRemotelyCallable({ removeBookmarkByUrl })

const removeBookmarkHandler = (id, { node }) =>
    node.url
        ? removeBookmarkByUrl(node.url)
        : console.warn('Cannot remove bookmark with no URL', node)

const AddBookmarkHandler = (id, node) =>
    id
        ? createNewPageForBookmark(id, node)
        : createBookmarkByExtension(node.url)

// Store and index any new browser bookmark
browser.bookmarks.onCreated.addListener(AddBookmarkHandler)
browser.bookmarks.onRemoved.addListener(removeBookmarkHandler)
