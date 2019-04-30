import initStorageManager from 'src/search/memory-storex'
import TwitterBackground from './'
import TwitterStorage from './storage'
import { StorageManager } from 'src/search'
import * as DATA from './storage.test.data'
import TagStorage from 'src/tags/background/storage'

describe('Twitter storage', () => {
    let twitterStorage: TwitterStorage
    let storageManager: StorageManager
    let twitterBg: TwitterBackground
    let tagStorage: TagStorage

    async function insertTestData() {
        for (const tweet of [DATA.tweet, DATA.tweet2]) {
            await twitterStorage.addTweet({ ...tweet })
        }
    }

    beforeEach(async () => {
        storageManager = initStorageManager()
        twitterBg = new TwitterBackground({
            storageManager,
        })

        twitterStorage = twitterBg['storage']
        tagStorage = new TagStorage({ storageManager })

        await storageManager.finishInitialization()
        await insertTestData()
    })

    describe('Read operations: ', () => {
        const assertTweet = (received, expected) => {
            expect(received.id).toEqual(expected.id)
            expect(received.text).toEqual(expected.text)
            expect(received.url).toEqual(expected.url)
            expect(received.userId).toEqual(expected.userId)
            expect(received.createdAt).toEqual(expected.createdAt)
        }

        test('fetch tags', async () => {
            const url = DATA.tweet2.url
            const tags = await tagStorage.fetchPageTags({ url })
            expect(tags).toBeDefined()
            expect(tags).not.toBeNull()
            expect(tags.length).toBe(DATA.tweet2.hashtags.length)
            expect(tags[0]).toBe(DATA.tweet2.hashtags[0])
        })

        describe('Delete operations: ', () => {
            test('delete tweet', async () => {
                const url = DATA.tweet.url
                const tweet = await twitterStorage.getTweetByUrl(url)
                assertTweet(tweet, DATA.tweet)
                await twitterStorage.delTweets([url])

                const afterDeletion = await twitterStorage.getTweetByUrl(url)

                expect(tweet).toBeDefined()
                expect(tweet).not.toBeNull()
                expect(afterDeletion).toBeNull()
            })
        })
    })
})
