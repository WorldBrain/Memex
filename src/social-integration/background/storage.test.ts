import initStorageManager from 'src/search/memory-storex'
import SocialBackground from './'
import SocialStorage from './storage'
import { StorageManager } from 'src/search'
import * as DATA from './storage.test.data'
import TagStorage from 'src/tags/background/storage'

describe('Twitter storage', () => {
    let socialStorage: SocialStorage
    let storageManager: StorageManager
    let socialBg: SocialBackground
    let tagStorage: TagStorage

    async function insertTestData() {
        for (const tweet of [DATA.tweet, DATA.tweet2]) {
            await socialStorage.addTweet({ ...tweet })
        }
    }

    beforeEach(async () => {
        storageManager = initStorageManager()
        socialBg = new SocialBackground({
            storageManager,
        })

        socialStorage = socialBg['storage']
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
                const tweet = await socialStorage.getTweetByUrl(url)
                assertTweet(tweet, DATA.tweet)
                await socialStorage.delTweets([url])

                const afterDeletion = await socialStorage.getTweetByUrl(url)

                expect(tweet).toBeDefined()
                expect(tweet).not.toBeNull()
                expect(afterDeletion).toBeNull()
            })
        })
    })
})
