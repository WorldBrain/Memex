import removeCommentsByUrl from './deletion'
import { createCommentsByUrl, createNewPageForComments } from './addition'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'

makeRemotelyCallable({ createCommentsByUrl })
makeRemotelyCallable({ removeCommentsByUrl })

const removeCommentsHandler = (id, { node }) =>
    node.url
        ? removeCommentsByUrl(node.url)
        : console.warn('Cannot remove bookmark with no URL', node)

// // Store and index any new browser bookmark
// browser.bookmarks.onCreated.addListener(createNewPageForBookmark)
// browser.bookmarks.onRemoved.addListener(removeBookmarkHandler)
