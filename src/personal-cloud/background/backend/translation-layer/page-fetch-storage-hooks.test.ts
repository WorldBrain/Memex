// import { MemoryTwitterAPI } from '@worldbrain/memex-common/lib/twitter-integration/api/index.tests'
import {
    DataFetchActionProcessor,
    TitleFetchAction,
    TextFetchAction,
} from '@worldbrain/memex-common/lib/opengraph/storage/hooks'
import type { ExceptionCapturer } from '@worldbrain/memex-common/lib/firebase-backend/types'
import { setupSyncBackgroundTest } from '../../index.tests'
import {
    ContentLocatorType,
    LocationSchemeType,
    ContentLocatorFormat,
    DataChangeType,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import type { TweetData } from '@worldbrain/memex-common/lib/twitter-integration/api/types'
import { createUploadStorageUtils } from '@worldbrain/memex-common/lib/personal-cloud/backend/translation-layer/storage-utils'
import { TITLE_FETCH_ACTION_COLLECTION_NAME } from '@worldbrain/memex-common/lib/opengraph/constants'
import type { FetchMockSandbox } from 'fetch-mock'
import type { OpenGraphSiteLookupResponse } from '@worldbrain/memex-common/lib/opengraph/types'
import { buildTwitterTitleFromOGResponse } from '@worldbrain/memex-common/lib/opengraph/utils'
import { PersonalCloudMediaContentType } from '@worldbrain/memex-common/lib/personal-cloud/backend/types'
import { buildMediaStoragePath } from '@worldbrain/memex-common/lib/personal-cloud/backend/utils'
import { StorexPersonalCloudMediaBackend } from '@worldbrain/memex-common/lib/personal-cloud/backend/storex'

const TEST_TWEET_A: TweetData = {
    name: 'Test User',
    username: 'test-user',
    text: 'test tweet text',
}

async function setupTest(opts: {
    captureException?: ExceptionCapturer
    simulateAPIError?: boolean
    testTweetData?: TweetData
}) {
    const {
        serverStorage,
        setups: [context],
    } = await setupSyncBackgroundTest({ deviceCount: 1 })

    // const twitterAPI = new MemoryTwitterAPI({
    //     testTweetData: opts.testTweetData ?? TEST_TWEET_A,
    //     errorOnGetTweet: opts.simulateAPIError,
    // })

    // await twitterAPI.setupAuth('test-key', 'test-secret')

    const getNow = () => Date.now()
    const userId = (await context.authService.getCurrentUser())?.id
    const processor = new DataFetchActionProcessor({
        fetch: context.fetch as any,
        openGraphIOAppId: 'some-app-id',
        captureException: opts.captureException ?? (async () => {}),
        storageManager: serverStorage.manager,
        personalCloudMediaBackend:
            context.backgroundModules.personalCloud.options.mediaBackend,
        storageUtils: await createUploadStorageUtils({
            storageManager: serverStorage.manager,
            deviceId: null,
            userId,
            getNow,
        }),
    })
    const mediaBackend = context.backgroundModules.personalCloud.options
        .mediaBackend as StorexPersonalCloudMediaBackend
    return { processor, storage: serverStorage, context, userId, mediaBackend }
}

describe('Translation-layer page data fetch hook integration tests', () => {
    // TODO: Fix this test
    it.skip('given a stored title fetch action, should derive page URL from stored locator data, download title data, then update associated content metadata', async () => {
        return

        // FCM Push related stuff is commented out until we need to reimplement it for MV3
        // const fcmTokens = ['test-device-1', 'test-device-2']

        let capturedException: Error | null = null
        const { processor, storage, userId, context } = await setupTest({
            testTweetData: TEST_TWEET_A,
            captureException: async (e) => {
                capturedException = e
            },
        })

        const normalizedUrl = 'twitter.com/user/status/123123123'

        const fetch = context.fetch as FetchMockSandbox
        const mockResponse: OpenGraphSiteLookupResponse = {
            url: normalizedUrl,
            hybridGraph: {
                url: normalizedUrl,
                description: 'test tweet',
                title: 'worldbrain',
            },
        }
        fetch.mock('*', 200, {
            response: JSON.stringify(mockResponse),
            sendAsJson: true,
        })

        // for (const token of fcmTokens) {
        //     await storage.manager
        //         .collection('userFCMRegistration')
        //         .createObject({
        //             token,
        //             createdWhen: Date.now(),
        //             user: userId,
        //         })
        // }

        const { object: contentMetadata } = await storage.manager
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

        await storage.manager
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

        const titleFetchAction: TitleFetchAction = {
            id: 1,
            user: userId,
            createdWhen: 1659333625307,
            updatedWhen: 1659333625307,
            personalContentMetadata: contentMetadata!.id,
        }
        await storage.manager
            .collection(TITLE_FETCH_ACTION_COLLECTION_NAME)
            .createObject(titleFetchAction)

        expect(context.pushMessagingService.sentMessages).toEqual([])
        expect(capturedException).toBeNull()
        expect(
            await storage.manager
                .collection('personalDataChange')
                .findAllObjects({}),
        ).toEqual([])
        expect(
            await storage.manager
                .collection(TITLE_FETCH_ACTION_COLLECTION_NAME)
                .findAllObjects({}),
        ).toEqual([titleFetchAction])
        expect(
            await storage.manager
                .collection('personalContentMetadata')
                .findAllObjects({}),
        ).toEqual([expect.objectContaining({ title: null })])

        await processor.processTitleFetchAction(titleFetchAction)

        // expect(context.pushMessagingService.sentMessages).toEqual([
        //     {
        //         type: 'to-user',
        //         userId: TEST_USER.email,
        //         payload: {
        //             type: 'downloadClientUpdates',
        //         },
        //     },
        // ])
        expect(capturedException).toBeNull()
        expect(
            await storage.manager
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
            await storage.manager
                .collection(TITLE_FETCH_ACTION_COLLECTION_NAME)
                .findAllObjects({}),
        ).toEqual([])
        expect(
            await storage.manager
                .collection('personalContentMetadata')
                .findAllObjects({}),
        ).toEqual([
            expect.objectContaining({
                title: buildTwitterTitleFromOGResponse(mockResponse),
            }),
        ])
    })

    // TODO: Fix this test

    it.skip('should fail gracefully, capturing exceptions in case of Twitter API errors', async () => {
        return
        let capturedException: Error | null = null
        const { processor, storage, userId } = await setupTest({
            simulateAPIError: true,
            testTweetData: TEST_TWEET_A,
            captureException: async (e) => {
                capturedException = e
            },
        })

        const normalizedUrl = 'twitter.com/user/status/123123123'

        const { object: contentMetadata } = await storage.manager
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

        await storage.manager
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
        await storage.manager
            .collection(TITLE_FETCH_ACTION_COLLECTION_NAME)
            .createObject(twitterAction)

        expect(capturedException).toBeNull()

        await processor.processTitleFetchAction(twitterAction)

        expect(capturedException).not.toBeNull()
        expect(capturedException.message).toEqual('simulated API error')
    })

    // TODO: Fix this test

    it.skip('should fail gracefully, capturing exceptions in case of data errors', async () => {
        return
        let capturedException: Error | null = null
        const { processor, storage, userId } = await setupTest({
            simulateAPIError: true,
            testTweetData: TEST_TWEET_A,
            captureException: async (e) => {
                capturedException = e
            },
        })

        const twitterAction = {
            id: 1,
            user: userId,
            createdWhen: 1659333625307,
            updatedWhen: 1659333625307,
            personalContentMetadata: 1, // NOTE: This doesn't exist in the DB!
        }
        await storage.manager
            .collection(TITLE_FETCH_ACTION_COLLECTION_NAME)
            .createObject(twitterAction)

        expect(capturedException).toBeNull()

        await processor.processTitleFetchAction(twitterAction)

        expect(capturedException).not.toBeNull()
        expect(capturedException.message).toEqual(
            'Could not derive tweet ID from stored data',
        )
    })

    it('given a stored page text fetch action, should derive page URL from stored locator data, download page HTML data, then upload it to media storage', async () => {
        return
        let capturedException: Error | null = null
        const {
            processor,
            storage,
            userId,
            context,
            mediaBackend,
        } = await setupTest({
            testTweetData: TEST_TWEET_A,
            captureException: async (e) => {
                capturedException = e
            },
        })

        const normalizedUrl = 'test.com'
        const testInnerHTML = `<p>some test body text</p>`
        const testHTML = `
            <html>
                <head>
                    <title>test title</title>
                </head>
                <body>${testInnerHTML}</body>
            </html>
        `

        const fetch = context.fetch as FetchMockSandbox
        fetch.mock('*', 200, { response: testHTML })

        const { object: contentMetadata } = await storage.manager
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

        await storage.manager
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

        const textFetchAction: TextFetchAction = {
            id: 1,
            user: userId,
            createdWhen: 1659333625307,
            updatedWhen: 1659333625307,
            personalContentMetadata: contentMetadata!.id,
        }
        await storage.manager
            .collection('personalPageTextFetchAction')
            .createObject(textFetchAction)

        expect(capturedException).toBeNull()
        expect(
            await storage.manager
                .collection('personalPageTextFetchAction')
                .findAllObjects({}),
        ).toEqual([textFetchAction])
        expect(
            await storage.manager
                .collection('personalDataChange')
                .findAllObjects({}),
        ).toEqual([])
        expect(mediaBackend.options.view.hub.storedObjects).toEqual([])

        await processor.processTextFetchAction(textFetchAction)

        expect(capturedException).toBeNull()
        expect(
            await storage.manager
                .collection('personalPageTextFetchAction')
                .findAllObjects({}),
        ).toEqual([])
        const storagePath = buildMediaStoragePath({
            subDir: 'docContent',
            userId: textFetchAction.user,
            fileName: textFetchAction.personalContentMetadata.toString(),
        })
        expect(
            await storage.manager
                .collection('personalDataChange')
                .findAllObjects({}),
        ).toEqual([
            {
                collection: ':media',
                createdByDevice: null,
                createdWhen: expect.any(Number),
                id: expect.any(Number),
                info: {
                    normalizedUrl,
                    type: 'htmlBody',
                },
                objectId: storagePath,
                type: 'modify',
                user: textFetchAction.user,
            },
        ])

        expect(mediaBackend.options.view.hub.storedObjects).toEqual([
            {
                path: storagePath,
                contentType: PersonalCloudMediaContentType.HTML,
                object: expect.stringContaining(testInnerHTML),
            },
        ])
    })
})
