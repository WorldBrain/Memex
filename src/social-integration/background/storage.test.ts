import Storex from '@worldbrain/storex'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'

import initStorageManager from 'src/search/memory-storex'
import CustomListBg from 'src/custom-lists/background'
import AnnotsBg from 'src/direct-linking/background'
import SocialBackground from './'
import SocialStorage from './storage'
import * as DATA from './storage.test.data'
import { Tweet, SocialPage } from '../types'
import { SocialSearchPlugin } from 'src/search/background/social-search'
import { SocialSearchParams } from 'src/search/background/types'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'

const assertTweetsEqual = (received: Tweet, expected: Tweet) => {
    expect(received.id).toEqual(expected.id)
    expect(received.text).toEqual(expected.text)
    expect(received.userId).toEqual(expected.userId)
    expect(received.createdAt).toEqual(expected.createdAt)
}

describe('Social storage', () => {
    async function insertTestData(params: {
        customListBg: CustomListBg
        socialStorage: SocialStorage
    }) {
        const listId = await params.customListBg.createCustomList({
            name: DATA.customListNameA,
        })

        for (const tweet of [DATA.tweetA, DATA.tweetB]) {
            // ID gets auto-assigned on insert.
            // Grab that and attach it to the test data docs, so we can compare them later.
            const postId = await params.socialStorage.addSocialPost({
                ...tweet,
            })
            tweet.id = postId
        }

        return { listId }
    }

    async function setupTest() {
        const {
            storageManager,
            backgroundModules,
        } = await setupBackgroundIntegrationTest()
        const socialStorage = backgroundModules.social.storage
        const { listId } = await insertTestData({
            socialStorage,
            customListBg: backgroundModules.customLists,
        })

        const search = ({
            skip = 0,
            limit = 10,
            ...args
        }: SocialSearchParams): Promise<Map<number, SocialPage>> =>
            storageManager.operation(SocialSearchPlugin.SEARCH_OP_ID, {
                limit,
                skip,
                ...args,
            })

        return { socialStorage, listId, search }
    }

    const addBookmarkTest = async () => {
        const { socialStorage, search } = await setupTest()
        const id = await socialStorage.addSocialBookmark({
            postId: DATA.tweetA.id,
        })

        const results = await search({ bookmarksOnly: true })
        const firstRes = [...results.values()][0]
        assertTweetsEqual(firstRes, DATA.tweetA)
        return { socialStorage, search }
    }

    const addListEntryTest = async () => {
        const { socialStorage, search, listId } = await setupTest()
        const id = await socialStorage.addListEntry({
            postId: DATA.tweetA.id,
            listId,
        })

        const results = await search({ collections: [listId.toString()] })
        const firstRes = [...results.values()][0]
        assertTweetsEqual(firstRes, DATA.tweetA)
        return { socialStorage, search, listId }
    }

    test('add bookmark', addBookmarkTest)

    test('add list entry', addListEntryTest)

    test('add hash tags', async () => {
        const { socialStorage, search } = await setupTest()

        await socialStorage.addSocialTags({
            postId: DATA.tweetA.id,
            hashtags: [DATA.hashTagA],
        })
        await socialStorage.addSocialTags({
            postId: DATA.tweetB.id,
            hashtags: [DATA.hashTagB],
        })

        const resultsA = await search({ hashtagsInc: [DATA.hashTagA] })
        const firstResA = [...resultsA.values()][0]
        assertTweetsEqual(firstResA, DATA.tweetA)

        const resultsB = await search({ hashtagsInc: [DATA.hashTagB] })
        const firstResB = [...resultsB.values()][0]
        assertTweetsEqual(firstResB, DATA.tweetB)

        const resultsC = await search({
            hashtagsInc: [DATA.hashTagA, DATA.hashTagB],
        })
        const valsC = [...resultsC.values()]
        expect(valsC.length).toBe(2)
        assertTweetsEqual(valsC[0], DATA.tweetA)
        assertTweetsEqual(valsC[1], DATA.tweetB)
    })

    test('add tags', async () => {
        const { socialStorage, search } = await setupTest()

        await socialStorage.addTagForPost({
            url: `socialPosts:${DATA.tweetA.id}`,
            name: DATA.tagA,
        })
        await socialStorage.addTagForPost({
            url: `socialPosts:${DATA.tweetB.id}`,
            name: DATA.tagB,
        })

        const resultsA = await search({ tagsInc: [DATA.tagA] })
        const firstResA = [...resultsA.values()][0]
        assertTweetsEqual(firstResA, DATA.tweetA)

        const resultsB = await search({ tagsInc: [DATA.tagB] })
        const firstResB = [...resultsB.values()][0]
        assertTweetsEqual(firstResB, DATA.tweetB)

        const resultsC = await search({ tagsInc: [DATA.tagA, DATA.tagB] })
        const valsC = [...resultsC.values()]
        expect(valsC.length).toBe(2)
        assertTweetsEqual(valsC[0], DATA.tweetA)
        assertTweetsEqual(valsC[1], DATA.tweetB)
    })

    test('add user', async () => {
        const { socialStorage, search } = await setupTest()

        await socialStorage.addSocialUser(DATA.userA)

        const resultsA = await search({ usersInc: [DATA.userA] })
        const firstResA = [...resultsA.values()][0]
        assertTweetsEqual(firstResA, DATA.tweetA)
    })

    test('delete bookmark', async () => {
        const { socialStorage, search } = await addBookmarkTest()
        await socialStorage.delSocialBookmark({ postId: DATA.tweetA.id })
        const results = await search({ bookmarksOnly: true })
        expect([...results.values()].length).toBe(0)
    })

    test('delete list entry', async () => {
        const { socialStorage, listId, search } = await addListEntryTest()
        await socialStorage.delListEntry({ postId: DATA.tweetA.id, listId })

        const results = await search({ collections: [listId.toString()] })
        expect([...results.values()].length).toBe(0)
    })

    test('delete post', async () => {
        const { socialStorage } = await setupTest()

        const id = DATA.tweetA.id
        const tweet = await socialStorage.getSocialPost({ id })
        assertTweetsEqual(tweet, DATA.tweetA)
        await socialStorage.delSocialPages({ postIds: [id] })

        const afterDeletion = await socialStorage.getSocialPost({ id })

        expect(tweet).toBeDefined()
        expect(tweet).not.toBeNull()
        expect(afterDeletion).toBeNull()
    })
})
