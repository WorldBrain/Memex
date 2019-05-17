import initStorageManager from 'src/search/memory-storex'
import SocialBackground from './'
import SocialStorage from './storage'
import { StorageManager } from 'src/search'
import * as DATA from './storage.test.data'

describe('Twitter storage', () => {
    let socialStorage: SocialStorage
    let storageManager: StorageManager
    let socialBg: SocialBackground

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

        describe('Delete operations: ', () => {
            test('delete tweet', async () => {
                const url = DATA.tweet.url
                const tweet = await socialStorage.getTweetByUrl(url)
                assertTweet(tweet, DATA.tweet)
                await socialStorage.delSocialPages([url])

                const afterDeletion = await socialStorage.getTweetByUrl(url)

                expect(tweet).toBeDefined()
                expect(tweet).not.toBeNull()
                expect(afterDeletion).toBeNull()
            })
        })
    })
})
