import { generateVisitDocId } from 'src/activity-logger'
import { generateBookmarkDocId } from 'src/bookmarks'
import { generateLaterlistDocId } from 'src/laterlist'
/**
 * Converts a browser.history.VisitItem to our visit document model.
 *
 * @param {history.VisitItem} visitItem The VisitItem fetched from browser API.
 * @param {IPageDoc} assocPageDoc The page doc that contains the page data for this visit.
 * @returns {IVisitDoc} Newly created visit doc dervied from visitItem data.
 */
export const transformToVisitDoc = assocPageDoc => visitItem => ({
    _id: generateVisitDocId({
        url: assocPageDoc.url,
        timestamp: visitItem.visitTime,
    }),
    browserId: visitItem.visitId,
    visitStart: visitItem.visitTime,
    referringVisitItemId: visitItem.referringVisitId,
    url: assocPageDoc.url,
    page: { _id: assocPageDoc._id },
})

/**
 * Converts a browser.bookmark.BookmarkTreeNode item to our bookmark document model.
 *
 * @param {bookmarks.BookmarkTreeNode} bookmarkItem The bookmark tree node item fetched from browser API.
 * @param {IPageDoc} assocPageDoc The page doc that contains the page data for this bookmark.
 * @returns {IBookmarkDoc} Newly created bookmark doc dervied from bookmarkItem data.
 */
export const transformToBookmarkDoc = assocPageDoc => bookmarkItem => ({
    _id: generateBookmarkDocId({
        url: bookmarkItem.url,
        timestamp: bookmarkItem.dateAdded,
    }),
    dateAdded: bookmarkItem.dateAdded,
    title: bookmarkItem.title,
    url: bookmarkItem.url,
    page: { _id: assocPageDoc._id },
})

// Below transformations only used for transforming old ext data
export const transformToMinimalVisitDoc = assocPageDoc => ({
    timestamp,
    url,
}) => ({
    _id: generateVisitDocId({ url, timestamp }),
    visitStart: timestamp,
    url,
    page: { _id: assocPageDoc._id },
})

export const transformToLaterlistDoc = assocPageDoc => laterlistItem => ({
    _id: generateLaterlistDocId({
        url: laterlistItem.url,
        timestamp: laterlistItem.dateAdded,
    }),
    dateAdded: laterlistItem.dateAdded,
    title: laterlistItem.title,
    url: laterlistItem.url,
    page: { _id: assocPageDoc._id },
})

export const transformToMinimalBookmarkDoc = assocPageDoc => ({
    timestamp,
    url,
}) => ({
    _id: generateBookmarkDocId({ url, timestamp }),
    dateAdded: timestamp,
    url,
    page: { _id: assocPageDoc._id },
})

export const transformToMinimalLaterlistDoc = assocPageDoc => ({
    timestamp,
    url,
}) => ({
    _id: generateLaterlistDocId({ url, timestamp }),
    dateAdded: timestamp,
    url,
    page: { _id: assocPageDoc._id },
})
