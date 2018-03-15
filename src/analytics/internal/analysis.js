import db from './db'
import { STORAGE_KEY } from 'src/options/blacklist/constants'

export async function EventProcessor({ type, timestamp }) {
    console.log(type, timestamp)
    // // Search Analysis
    // const totalSearches = await db.eventLog
    //     .where('category')
    //     .equals('Search')
    //     .count()
    // const unsuccessfulSearches = await db.eventLog
    //     .where('action')
    //     .startsWith('Unsuccessful search')
    //     .count()
    // const successfulSearches = totalSearches - unsuccessfulSearches
    // const popupSearches = await db.eventLog
    //     .where('action')
    //     .equals('Popup search')
    //     .count()
    // console.log({
    //     totalSearches,
    //     unsuccessfulSearches,
    //     successfulSearches,
    //     popupSearches,
    // })
    // // Tagging Analysis
    // const addTags = await db.eventLog
    //     .where('action')
    //     .equals('Add tag')
    //     .count()
    // const delTags = await db.eventLog
    //     .where('action')
    //     .equals('Delete tag')
    //     .count()
    // const filterByTags = await db.eventLog
    //     .where('action')
    //     .equals('Filter by tag')
    //     .count()
    // const totalTagsUsed = addTags + delTags + filterByTags
    // console.log({ addTags, delTags, filterByTags, totalTagsUsed })
    // // Domains Filtering Analysis
    // const filterByDomain = await db.eventLog
    //     .where('category')
    //     .equals('domain')
    //     .count()
    // console.log({ filterByDomain })
    // // Blacklist pages
    // const { blacklist } = await browser.storage.local.get(STORAGE_KEY)
    // const blacklistPages = JSON.parse(blacklist).length
    // const blacklistDomainsPopup = await db.eventLog
    //     .where('action')
    //     .equals('Blacklist domain')
    //     .count()
    // const blacklistSitesPopup = await db.eventLog
    //     .where('action')
    //     .equals('Blacklist site')
    //     .count()
    // const deleteBlacklistPagePopup = await db.eventLog
    //     .where('action')
    //     .equals('Delete blacklisted page')
    //     .count()
    // console.log({
    //     blacklistPages,
    //     blacklistDomainsPopup,
    //     blacklistSitesPopup,
    //     deleteBlacklistPagePopup,
    // })
    // // Bookmarks
    // const popupBookmarksAdd = await db.eventLog
    //     .where('action')
    //     .equals('Create popup bookmark')
    //     .count()
    // const popupBookmarksRemove = await db.eventLog
    //     .where('action')
    //     .equals('Remove popup bookmark')
    //     .count()
    // const overviewBookmarkAdd = await db.eventLog
    //     .where('action')
    //     .equals('Create result bookmark')
    //     .count()
    // const overviewBookmarkRemove = await db.eventLog
    //     .where('action')
    //     .equals('Remove result bookmark')
    //     .count()
    // const totalBookmarks =
    //     popupBookmarksAdd +
    //     overviewBookmarkAdd -
    //     popupBookmarksRemove -
    //     overviewBookmarkRemove
    // console.log({
    //     totalBookmarks,
    //     popupBookmarksAdd,
    //     overviewBookmarkAdd,
    //     popupBookmarksRemove,
    //     overviewBookmarkRemove,
    // })
    // // Time filter
    // const startDateSelection = await db.eventLog
    //     .where('category')
    //     .equals('Overview start date')
    //     .count()
    // const endDateSelection = await db.eventLog
    //     .where('category')
    //     .equals('Overview end date')
    //     .count()
    // console.log({ startDateSelection, endDateSelection })
}
