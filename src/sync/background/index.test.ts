import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
} from 'src/tests/integration-tests'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'

describe('SyncBackground', () => {
    it.skip('should not do anything if not enabled', () => {})
    it.skip('should sync every 15 minutes once enabled', () => {})
    it.skip('should reschedule a sync in case of network failures', () => {})

    it('should do the whole onboarding flow correctly', async () => {
        const setups = [
            await setupBackgroundIntegrationTest(),
            await setupBackgroundIntegrationTest(),
        ]
        const syncModule = (setup: BackgroundIntegrationTestSetup) =>
            setup.backgroundModules.sync
        const searchModule = (setup: BackgroundIntegrationTestSetup) =>
            setup.backgroundModules.search
        const customLists = (setup: BackgroundIntegrationTestSetup) =>
            setup.backgroundModules.customLists.remoteFunctions

        const listId = await setups[0].backgroundModules.customLists.createCustomList(
            {
                name: 'My list',
            },
        )
        await setups[0].backgroundModules.customLists.insertPageToList({
            id: listId,
            url: 'http://bla.com/',
        })
        await searchModule(setups[0]).searchIndex.addPage({
            pageDoc: {
                url: 'http://www.bla.com/',
                content: {
                    fullText: 'home page content',
                    title: 'bla.com title',
                },
            },
            visits: [],
        })

        const { initialMessage } = await syncModule(
            setups[0],
        ).remoteFunctions.requestInitialSync()
        await syncModule(setups[1]).remoteFunctions.answerInitialSync({
            initialMessage,
        })

        await syncModule(setups[0]).initialSync.waitForInitialSync()
        await syncModule(setups[1]).initialSync.waitForInitialSync()

        expect(
            await customLists(setups[1]).fetchListById({
                id: listId,
            }),
        ).toEqual({
            id: listId,
            name: 'My list',
            isDeletable: true,
            isNestable: true,
            createdAt: expect.any(Date),
            pages: ['http://www.bla.com/'],
            active: true,
        })

        await syncModule(setups[0]).initDevice()
        await syncModule(setups[1]).initDevice()

        await syncModule(setups[0]).remoteFunctions.enableContinuousSync()
        await syncModule(setups[1]).remoteFunctions.enableContinuousSync()

        await customLists(setups[1]).updateListName({
            id: listId,
            name: 'Updated List Title',
        })

        await syncModule(setups[1]).remoteFunctions.forceIncrementalSync()
        await syncModule(setups[0]).remoteFunctions.forceIncrementalSync()

        expect(
            await customLists(setups[0]).fetchListById({
                id: listId,
            }),
        ).toEqual({
            id: listId,
            name: 'Updated List Title',
            isDeletable: true,
            isNestable: true,
            createdAt: expect.any(Date),
            pages: ['http://www.bla.com/'],
            active: true,
        })
    })
})

// export const INTEGRATION_TESTS = backgroundIntegrationTestSuite('Sync functionality', [
//     backgroundIntegrationTest('should do the whole onboarding flow correctly', () => {
//         return {
//             steps: [
//                 {
//                     description: 'enable sync',
//                     execute: async ({ setup }) => {

//                     },
//                 },
//                 {
//                     description: 'do initial sync',
//                     execute: async ({ setup }) => {

//                     },
//                 },
//             ]
//         }
//     })
// ])
