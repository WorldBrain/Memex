import { MemoryTwitterAPI } from '@worldbrain/memex-common/lib/twitter-integration/api/index.tests'
import { TwitterActionProcessor } from '@worldbrain/memex-common/lib/twitter-integration/storage/hooks'
import type { ExceptionCapturer } from '@worldbrain/memex-common/lib/firebase-backend/types'
import { setupSyncBackgroundTest } from '../../index.tests'
import {
    ContentLocatorType,
    LocationSchemeType,
    ContentLocatorFormat,
    DataChangeType,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import type { TweetData } from '@worldbrain/memex-common/lib/twitter-integration/api/types'
import { tweetDataToTitle } from '@worldbrain/memex-common/lib/twitter-integration/utils'

const TEST_TWEET_A: TweetData = {
    name: 'Test User',
    username: 'test-user',
    text: 'test tweet text',
}

async function setupTest(opts: {
    captureException?: ExceptionCapturer
    testTweetData?: TweetData
}) {
    const {
        userId,
        serverStorage,
        setups: [context],
    } = await setupSyncBackgroundTest({ deviceCount: 1 })

    const processor = new TwitterActionProcessor({
        twitterAPI: new MemoryTwitterAPI(opts.testTweetData ?? TEST_TWEET_A),
        captureException: opts.captureException ?? (async () => {}),
        storageManager: serverStorage.storageManager,
        userId,
    })
    return { processor, storage: serverStorage, context, userId }
}

describe('Translation-layer Twitter integration tests', () => {
    it('given a stored twitter action, should device tweet ID from stored locator data, download tweet data from Twitter API, derive title, then update associated content metadata', async () => {
        let capturedException: Error | null = null
        const { processor, storage, userId } = await setupTest({
            captureException: async (e) => {
                capturedException = e
            },
            testTweetData: TEST_TWEET_A,
        })

        const normalizedUrl = 'twitter.com/user/status/123123123'

        const {
            object: contentMetadata,
        } = await storage.storageManager
            .collection('personalContentMetadata')
            .createObject({
                id: 1,
                canonicalUrl: normalizedUrl,
                title: null,
                lang: null,
                user: userId,
                description: null,
                createdByDevice: null,
                createdWhen: 1659333625307,
                updatedWhen: 1659333625307,
            })

        await storage.storageManager
            .collection('personalContentLocator')
            .createObject({
                id: 1,
                personalContentMetadata: contentMetadata!.id,
                locationType: ContentLocatorType.Remote,
                locationScheme: LocationSchemeType.NormalizedUrlV1,
                format: ContentLocatorFormat.HTML,
                location: normalizedUrl,
                originalLocation: 'https://' + normalizedUrl,
                version: 0,
                valid: true,
                primary: true,
                contentSize: null,
                fingerprint: null,
                lastVisited: 0,
                localId: null,
                user: userId,
                createdByDevice: null,
                createdWhen: 1659333625307,
                updatedWhen: 1659333625307,
            })

        const twitterAction = {
            id: 1,
            user: userId,
            createdWhen: 1659333625307,
            updatedWhen: 1659333625307,
            personalContentMetadata: contentMetadata!.id,
        }
        await storage.storageManager
            .collection('personalTwitterAction')
            .createObject(twitterAction)

        expect(capturedException).toBeNull()
        expect(
            await storage.storageManager
                .collection('personalDataChange')
                .findAllObjects({}),
        ).toEqual([])
        expect(
            await storage.storageManager
                .collection('personalTwitterAction')
                .findAllObjects({}),
        ).toEqual([twitterAction])
        expect(
            await storage.storageManager
                .collection('personalContentMetadata')
                .findAllObjects({}),
        ).toEqual([expect.objectContaining({ title: null })])

        await processor.processTwitterAction(twitterAction)

        expect(capturedException).toBeNull()
        expect(
            await storage.storageManager
                .collection('personalDataChange')
                .findAllObjects({}),
        ).toEqual([
            {
                id: expect.any(Number),
                user: userId,
                createdByDevice: null,
                type: DataChangeType.Modify,
                objectId: contentMetadata!.id,
                createdWhen: expect.any(Number),
                collection: 'personalContentMetadata',
            },
        ])
        expect(
            await storage.storageManager
                .collection('personalTwitterAction')
                .findAllObjects({}),
        ).toEqual([])
        expect(
            await storage.storageManager
                .collection('personalContentMetadata')
                .findAllObjects({}),
        ).toEqual([
            expect.objectContaining({ title: tweetDataToTitle(TEST_TWEET_A) }),
        ])
    })
})
