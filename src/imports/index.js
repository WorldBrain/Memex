import { generateVisitDocId } from 'src/activity-logger'
import { generateBookmarkDocId } from 'src/bookmarks'

export const estimatesStorageKey = 'import-estimate-counts'

export const getStoredEsts = async () => {
    const storage = await browser.storage.local.get({
        [estimatesStorageKey]: { calculatedAt: 0 },
    })
    return storage[estimatesStorageKey]
}

export const setStoredEsts = estimates =>
    browser.storage.local.set({
        [estimatesStorageKey]: { ...estimates, calculatedAt: Date.now() },
    })

export const dirtyStoredEsts = () =>
    getStoredEsts().then(storedEsts =>
        browser.storage.local.set({
            [estimatesStorageKey]: { ...storedEsts, calculatedAt: 0 },
        }),
    )

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

export const transformToMinimalBookmarkDoc = assocPageDoc => ({
    timestamp,
    url,
}) => ({
    _id: generateBookmarkDocId({ url, timestamp }),
    dateAdded: timestamp,
    url,
    page: { _id: assocPageDoc._id },
})
