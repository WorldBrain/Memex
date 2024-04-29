import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import PushMessagingClient from '.'

const defaultListName = 'test list a'

async function setupTest(opts: {
    createDefaultList: boolean
    createAssocLocalFollowedList?: boolean
}) {
    const context = await setupBackgroundIntegrationTest()
    const pushMessagingClient = new PushMessagingClient()
    pushMessagingClient.bgModules = context.backgroundModules

    const serverStorage = context.serverStorage
    let defaultListId: string | null = null
    if (opts.createDefaultList) {
        const { object } = await serverStorage.manager
            .collection('sharedList')
            .createObject({
                creator: TEST_USER.id,
                title: defaultListName,
                createdWhen: new Date(),
                updatedWhen: new Date(),
            })
        defaultListId = object.id

        if (opts.createAssocLocalFollowedList) {
            await context.backgroundModules.pageActivityIndicator.createFollowedList(
                {
                    creator: TEST_USER.id,
                    name: defaultListName,
                    sharedList: defaultListId,
                },
            )
        }
    }

    return { pushMessagingClient, serverStorage, defaultListId, ...context }
}

describe('Push messaging client tests', () => {
    it('should trigger sync continuation upon receiving sync trigger message', async () => {
        const { pushMessagingClient, backgroundModules } = await setupTest({
            createDefaultList: false,
        })
        let hasSyncBeenTriggered = false

        backgroundModules.personalCloud.invokeSyncDownload = async () => {
            hasSyncBeenTriggered = true
        }

        expect(hasSyncBeenTriggered).toBe(false)
        await pushMessagingClient.handleIncomingMessage({
            type: 'downloadClientUpdates',
        })
        expect(hasSyncBeenTriggered).toBe(true)
    })

    describe.skip('FCM implementation for page activity indicator', () => {
        it(`should create/delete followedListEntry records when receiving created/deleted sharedListEntry messages`, async () => {
            const {
                pushMessagingClient,
                defaultListId,
                storageManager,
            } = await setupTest({
                createDefaultList: true,
                createAssocLocalFollowedList: true,
            })

            const expectedEntryA = {
                id: expect.any(Number),
                creator: TEST_USER.id,
                entryTitle: 'test title a',
                followedList: defaultListId,
                hasAnnotations: false,
                normalizedPageUrl: 'test.com/a',
                createdWhen: 1,
                updatedWhen: 1,
            }
            const expectedEntryB = {
                id: expect.any(Number),
                creator: TEST_USER.id,
                entryTitle: 'test title b',
                followedList: defaultListId,
                hasAnnotations: false,
                normalizedPageUrl: 'test.com/b',
                createdWhen: 2,
                updatedWhen: 2,
            }

            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await pushMessagingClient.handleIncomingMessage(
                {
                    type: 'createPageListEntry',
                    creator: TEST_USER.id,
                    sharedList: defaultListId,
                    entryTitle: expectedEntryA.entryTitle,
                    normalizedPageUrl: expectedEntryA.normalizedPageUrl,
                },
                { now: expectedEntryA.createdWhen },
            )

            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([expectedEntryA])

            await pushMessagingClient.handleIncomingMessage(
                {
                    type: 'createPageListEntry',
                    creator: TEST_USER.id,
                    sharedList: defaultListId,
                    entryTitle: expectedEntryB.entryTitle,
                    normalizedPageUrl: expectedEntryB.normalizedPageUrl,
                },
                { now: expectedEntryB.createdWhen },
            )

            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([expectedEntryA, expectedEntryB])

            await pushMessagingClient.handleIncomingMessage({
                type: 'deletePageListEntry',
                sharedList: defaultListId,
                normalizedPageUrl: expectedEntryA.normalizedPageUrl,
            })

            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([expectedEntryB])

            await pushMessagingClient.handleIncomingMessage({
                type: 'deletePageListEntry',
                sharedList: defaultListId,
                normalizedPageUrl: expectedEntryB.normalizedPageUrl,
            })

            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])
        })

        it(`should toggle 'hasAnnotations' flag on assoc. followedListEntry when receiving first/last sharedListEntry added/removed messages`, async () => {
            const {
                pushMessagingClient,
                storageManager,
                defaultListId,
            } = await setupTest({
                createDefaultList: true,
                createAssocLocalFollowedList: true,
            })

            const expectedEntryA = {
                id: expect.any(Number),
                creator: TEST_USER.id,
                entryTitle: 'test title a',
                followedList: defaultListId,
                hasAnnotations: false,
                normalizedPageUrl: 'test.com/a',
                createdWhen: 1,
                updatedWhen: 1,
            }

            // Do create list entry message first, to trigger the creation of a followedListEntry to work with
            await pushMessagingClient.handleIncomingMessage(
                {
                    type: 'createPageListEntry',
                    creator: TEST_USER.id,
                    sharedList: defaultListId,
                    entryTitle: expectedEntryA.entryTitle,
                    normalizedPageUrl: expectedEntryA.normalizedPageUrl,
                },
                { now: expectedEntryA.createdWhen },
            )

            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([expectedEntryA])

            await pushMessagingClient.handleIncomingMessage(
                {
                    type: 'createFirstAnnotationListEntry',
                    normalizedPageUrl: expectedEntryA.normalizedPageUrl,
                    sharedList: defaultListId,
                },
                { now: 2 },
            )

            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([
                { ...expectedEntryA, hasAnnotations: true, updatedWhen: 2 },
            ])

            await pushMessagingClient.handleIncomingMessage(
                {
                    type: 'deleteLastAnnotationListEntry',
                    normalizedPageUrl: expectedEntryA.normalizedPageUrl,
                    sharedList: defaultListId,
                },
                { now: 3 },
            )

            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([
                { ...expectedEntryA, hasAnnotations: false, updatedWhen: 3 },
            ])

            await pushMessagingClient.handleIncomingMessage(
                {
                    type: 'createFirstAnnotationListEntry',
                    normalizedPageUrl: expectedEntryA.normalizedPageUrl,
                    sharedList: defaultListId,
                },
                { now: 4 },
            )

            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([
                { ...expectedEntryA, hasAnnotations: true, updatedWhen: 4 },
            ])
        })

        it(`should create/delete followedList and assoc. followedListEntry records when receiving sharedList followed/unfollowed messages`, async () => {
            const {
                pushMessagingClient,
                storageManager,
                defaultListId,
            } = await setupTest({
                createDefaultList: true,
                createAssocLocalFollowedList: false,
            })

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await pushMessagingClient.handleIncomingMessage({
                type: 'followList',
                sharedList: defaultListId,
            })

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([
                {
                    name: defaultListName,
                    creator: TEST_USER.id,
                    sharedList: defaultListId,
                    lastSync: expect.any(Number),
                },
            ])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([
                {
                    creator: TEST_USER.id,
                    entryTitle: 'test title a',
                    followedList: defaultListId,
                    hasAnnotations: false,
                    normalizedPageUrl: 'test.com/a',
                    createdWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                },
                {
                    creator: TEST_USER.id,
                    entryTitle: 'test title b',
                    followedList: defaultListId,
                    hasAnnotations: false,
                    normalizedPageUrl: 'test.com/b',
                    createdWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                },
            ])

            await pushMessagingClient.handleIncomingMessage({
                type: 'unfollowList',
                sharedList: defaultListId,
            })

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])
        })
    })
})
