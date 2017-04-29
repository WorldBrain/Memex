// Imports the full browser's bookmarks into our database.
// The browser's bookmarkItems and visitItems are quite straightforwardly
// converted to pageDocs and visitDocs (sorry for the confusingly similar name).


import db from 'src/pouchdb'
import { updatePageSearchIndex } from 'src/search/find-pages'
import { isWorthRemembering,
		 generateVisitDocId,
         visitKeyPrefix,
         convertVisitDocId } from 'src/activity-logger'
import { generatePageDocId } from 'src/page-storage'


/*
@Description
Array getBookmarkTree()
Get the Whole Browser Bookmark Tree.

@Params
void

@Return
Array bookmarkItems  
*/
async function getBookmarkTree() {

    const bookmarkTree = await browser.bookmarks.getTree();
    const bookmarkItems = bookmarkTree[0].children[0].children.concat(bookmarkTree[0].children[1].children);
    
    return bookmarkItems.filter(({url}) => isWorthRemembering({url}));
}


/*
@Description
Object getRecentBookmarks(count = 5)
Get Recent Browser Bookmark Items.

@Params
Integer count = 5

@Return
Object Obj.quantity 
*/
export async function getRecentBookmarks(count = 5) {
    const recentBookmarkItems = await browser.bookmarks.getRecent(count)
    return {
        quantity: bookmarkItems.length,
    }
}


/*async function getBookmarkTreeItems([...bookmarkTreeId] = []) {
    const bookmarkTreeItems = await browser.bookmarks.get(bookmarkTreeId);
    let   

    for(let i = 0; i < bookmarkTreeItems.length; i++){


    }

    return bookmarkItems.filter(({url}) => isWorthRemembering({url}))
}*/


/*
@Description
Object transformToPageDoc({bookmarkItem})
Transform a bookmark item to a page document which is our way of storing a page in the db

@Params
Object bookmarkItem

@Return
Object pageDoc
*/
function transformToPageDoc({bookmarkItem}) {
    const pageDoc = {
        _id: generatePageDocId({
            timestamp: bookmarkItem.dateAdded,
            // We set the nonce manually, to prevent duplicating items if
            // importing multiple times (thus making importBookmark idempotent).
            nonce: `bookmarks-${bookmarkItem.id}`,
        }),
        url: bookmarkItem.url,
        title: bookmarkItem.title,
    }
    return pageDoc
}


/*
@Description
Object transformToVisitDoc({visitItem, pageDoc})
Transform a bookmark item to a visited page document because a bookmark has once been a visited page.

@Params
Object visitItem
Object pageDoc

@Return
Object Obj
*/
function transformToVisitDoc({visitItem, pageDoc}) {
    return {
        _id: generateVisitDocId({
            timestamp: visitItem.visitTime,
            // We set the nonce manually, to prevent duplicating items if
            // importing multiple times (thus making importHistory idempotent).
            nonce: `history-${visitItem.visitId}`,
        }),
        visitStart: visitItem.visitTime,
        // Temporarily keep the pointer to the browser history's id numbering.
        // Will be replaced by the id of the corresponding visit in our model.
        referringVisitItemId: visitItem.referringVisitId,
        url: pageDoc.url,
        page: {
            _id: pageDoc._id,
        },
    }
}


/*
@Description
Object of Arrays convertBookmarksToPagesAndVisits({bookmarkItems, visitItemsPerBookmarkItem})
Convert data from the browser's bookmarks to our data model.

@Params
Array bookmarkItems
Object visitItemsPerBookmarkItem

@Return
Object of Arrays pageDocs, visitDocs.
*/
function convertBookmarksToPagesAndVisits({
    bookmarkItems,
    visitItemsPerBookmarkItem,
}) {
    const pageDocs = []
    const visitDocs = {}
    bookmarkItems.forEach((bookmarkItem, i) => {
        // Read the visitItems corresponding to this bookmarkItem
        const visitItems = visitItemsPerBookmarkItem[i]
        // Map each pair to a page...
        const pageDoc = transformToPageDoc({bookmarkItem})
        pageDocs.push(pageDoc)
        // ...and one or more visits to that page.
        visitItems.forEach(visitItem => {
            const visitDoc = transformToVisitDoc({visitItem, pageDoc})
            visitDocs[visitItem.visitId] = visitDoc
        })
    })
    // Now each new visit has an id, we can map the referrer-paths between them.
    Object.values(visitDocs).forEach(visitDoc => {
        // Take and forget the id of the visitItem in the browser's bookmark.
        const referringVisitItemId = visitDoc.referringVisitItemId
        delete visitDoc.referringVisitItemId
        if (referringVisitItemId && referringVisitItemId !== '0') {
            // Look up what visit this id maps to in our model.
            const referringVisitDoc = visitDocs[referringVisitItemId]
            if (referringVisitDoc) {
                const referringVisitDocId = referringVisitDoc._id
                // Add a reference to the visit document.
                visitDoc.referringVisit = {_id: referringVisitDocId}
            } else {
                // Apparently the referring visit is not present in the bookmark.
                // We can just pretend that there was no referrer.
            }
        }
    })
    // Return the new docs.
    return {
        pageDocs,
        visitDocs: Object.values(visitDocs), // we can forget the old ids now
    }
}


/*
@Description
void importBookamrks()
Pulls the full browser bookmarks into the database.

@Params
void

@Return
void
*/
export default async function importBookamrks() {
    // Get the full bookmarks: both the bookmarkItems and visitItems.
    console.time('import Bookmarks')
    const bookmarkItems = await getBookmarkTree()
    // Get all visits to each of those items.
    const visitItemsPs = bookmarkItems.map(async bookmarkItem =>
        await browser.history.getVisits({url: bookmarkItem.url})
    )
    const visitItemsPerBookmarkItem = await Promise.all(visitItemsPs)
    // Convert everything to our data model
    const {pageDocs, visitDocs} = convertBookmarksToPagesAndVisits({
        bookmarkItems,
        visitItemsPerBookmarkItem,
    })
    let allDocs = pageDocs.concat(visitDocs)
    // Mark each doc to remember it originated from this import action.
    const importTimestamp = Date.now()
    allDocs = allDocs.map(doc => ({
        ...doc,
        importedFromBrowserBookmarks: importTimestamp,
    }))
    // Store them into the database. Already existing docs will simply be
    // rejected, because their id (timestamp & history id) already exists.
    //console.log(allDocs);
    
    await db.bulkDocs(allDocs)
    console.timeEnd('import bookmark')
    console.time('rebuild search index')
    await updatePageSearchIndex()
    console.timeEnd('rebuild search index')
}


/*
@Description
Object getOldestVisitTimestamp()
Get the timestamp of the oldest visit in our database

@Params
void

@Return
Object
*/
export async function getOldestVisitTimestamp() {
    const result = await db.allDocs({startkey: visitKeyPrefix, limit: 1})
    return (result.rows.length > 0)
        ? convertVisitDocId(result.rows[0].id).timestamp
        : undefined
}


/*
@Description
Object getBookmarksStats()
Get the number of importable items from Browser Bookmarks

@Params
void

@Return
Object
*/
export async function getBookmarksStats() {
    const bookmarkItems = await getBookmarkTree()
    return {
        quantity: bookmarkItems.length,
    }
}


export async function getBookmarkTreeItems([...bookmarkId] = []) {
	console.log(bookmarkId, browser.bookmarks);
    const bookmarkItems = await browser.bookmarks.get(bookmarkId);
    const bookmarkTree = await browser.bookmarks.getTree();
    const allBookmarks = bookmarkTree[0].children[0].children.concat(bookmarkTree[0].children[1].children);
    const allDb = await db.allDocs({
    									include_docs: true,
    									attachments: true
  								    });

    console.log(db,allDb,allBookmarks);
}
