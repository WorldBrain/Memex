import { Thunk, Tweet } from './types'
import * as tagActs from 'src/popup/tags-button/actions'
import * as collectionActs from 'src/popup/collections-button/actions'
import { remoteFunction } from 'src/util/webextensionRPC'
import { getTweetInfo } from './observers/get-tweet-data'

const fetchSocialPostTags = remoteFunction('fetchSocialPostTags')
const fetchInitTagSuggRPC = remoteFunction('extendedSuggest')
const fetchSocialPostLists = remoteFunction('fetchSocialPostLists')
const fetchAllListsRPC = remoteFunction('fetchAllLists')
const addBookmarkRPC = remoteFunction('addSocialBookmark')
const delBookmarkRPC = remoteFunction('delSocialBookmark')
const addTweetRPC = remoteFunction('addTweet')

export const initState: (url: string) => Thunk = url => async dispatch => {
    try {
        const listsAssocWithPage = await fetchSocialPostLists({ url })
        const lists = await fetchAllListsRPC({
            skipMobileList: true,
            excludeIds: listsAssocWithPage.map(({ id }) => id),
            limit: 20,
        })
        dispatch(collectionActs.setInitColls([...listsAssocWithPage, ...lists]))
        dispatch(collectionActs.setCollections(listsAssocWithPage))

        // Get 20 more tags that are not related related to the list.
        const pageTags = await fetchSocialPostTags({ url })
        const tags = await fetchInitTagSuggRPC(pageTags, 'tag')
        dispatch(tagActs.setInitTagSuggests([...pageTags, ...tags]))
        dispatch(tagActs.setTags(pageTags))
    } catch (err) {
        // Do nothing; just catch the error - means page doesn't exist for URL
    }
}

export const toggleBookmark: (url: string, isBookmarked: boolean) => Thunk = (
    url,
    isBookmarked,
) => async dispatch => {
    const bookmarkRPC = isBookmarked ? delBookmarkRPC : addBookmarkRPC
    try {
        await bookmarkRPC({ url })
    } catch (err) {}
}

export const saveTweet: (
    element: HTMLElement,
) => Thunk = element => async dispatch => {
    try {
        const tweet = getTweetInfo(element)
        const id = await addTweetRPC(tweet)
        return id
    } catch (err) {}
}
