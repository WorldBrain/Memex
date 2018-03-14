import { createNewPageForBookmark } from '../../bookmarks/background/addition.js'

browser.extension.onMessage.addListener((message, sender, sendResponse) => {
    const bookmarkInfo = {}
    bookmarkInfo.url = sender.url
    bookmarkInfo.title = document.title
    createNewPageForBookmark(sender.url, bookmarkInfo)
})
