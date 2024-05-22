import Logic, { State, Event } from './logic'
import {
    insertBackgroundFunctionTab,
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import { createSyncSettingsStore } from 'src/sync-settings/util'

const TEST_EXT_PAGE = 'chrome-extension://testest.html'
const DEFAULT_PAGE = 'https://getmemex.com'

async function setupTest(
    { backgroundModules, browserAPIs, createElement }: UILogicTestDevice,
    args?: {
        currentPageUrl?: string
        openPage?: (url: string) => void
    },
) {
    const syncSettingsStore = createSyncSettingsStore({
        syncSettingsBG: backgroundModules.syncSettings,
    })

    const _logic = new Logic({
        tabsAPI: {
            create: browserAPIs.tabs.create,
            query: () => [{ url: args?.currentPageUrl ?? DEFAULT_PAGE }] as any,
            update: args?.openPage
                ? (((tabId, { url }) => args.openPage(url)) as any)
                : () => [{}] as any,
        },
        runtimeAPI: {
            getURL: () => TEST_EXT_PAGE,
        },
        syncSettings: syncSettingsStore,
        pageIndexingBG: insertBackgroundFunctionTab(
            backgroundModules.pages.remoteFunctions,
        ) as any,
        authBG: backgroundModules.auth.remoteFunctions,
        pdfIntegrationBG: backgroundModules.pdfBg.remoteFunctions,
        customListsBG: backgroundModules.customLists.remoteFunctions,
        analyticsBG: backgroundModules.analyticsBG,
        extensionAPI: { isAllowedFileSchemeAccess: async () => true },
        annotationsBG: backgroundModules.directLinking.remoteFunctions,
    })

    const logic = createElement<State, Event>(_logic)

    return { _logic, logic, syncSettingsStore }
}

describe('Popup UI logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it(
        'should check whether tags migration is done to signal showing of tags UI on init',
        async ({ device }) => {
            const currentPageUrl = 'https://memex.memex'
            const { logic, syncSettingsStore } = await setupTest(device, {
                currentPageUrl,
            })

            await syncSettingsStore.extension.set(
                'areTagsMigratedToSpaces',
                false,
            )
            expect(logic.state.shouldShowTagsUIs).toBe(false)
            await logic.init()
            expect(logic.state.shouldShowTagsUIs).toBe(true)

            await syncSettingsStore.extension.set(
                'areTagsMigratedToSpaces',
                true,
            )
            expect(logic.state.shouldShowTagsUIs).toBe(true)
            await logic.init()
            expect(logic.state.shouldShowTagsUIs).toBe(false)
        },
        { shouldSkip: true },
    )

    it(
        'should hydrate PDF reader enabled state based on sync settings+current URL on init',
        async ({ device }) => {
            const currentPageUrl = 'https://memex.memex'
            const { logic, syncSettingsStore } = await setupTest(device, {
                currentPageUrl,
            })

            await syncSettingsStore.pdfIntegration.set('shouldAutoOpen', true)
            expect(logic.state.isPDFReaderEnabled).toBe(false)
            expect(logic.state.currentTabFullUrl).toBe('')
            expect(logic.state.loadState).toBe('pristine')
            await logic.init()
            expect(logic.state.isPDFReaderEnabled).toBe(true)
            expect(logic.state.currentTabFullUrl).toBe(currentPageUrl)
            expect(logic.state.loadState).toBe('success')

            await syncSettingsStore.pdfIntegration.set('shouldAutoOpen', false)
            expect(logic.state.isPDFReaderEnabled).toBe(true)
            await logic.init()
            expect(logic.state.isPDFReaderEnabled).toBe(false)
        },
        { shouldSkip: true },
    )

    it(
        'should hydrate page lists on init',
        async ({ device }) => {
            const currentPageUrl = 'https://memex.memex'
            const { logic } = await setupTest(device, {
                currentPageUrl,
            })
            const [
                listIdA,
                listIdB,
            ] = await device.backgroundModules.customLists.createCustomLists({
                names: ['test a', 'test b'],
            })

            expect(logic.state.pageListIds).toEqual([])
            await logic.init()
            expect(logic.state.pageListIds).toEqual([])

            await device.backgroundModules.customLists.insertPageToList({
                url: currentPageUrl,
                id: listIdA,
                skipPageIndexing: true,
            })
            await logic.init()
            expect(logic.state.pageListIds).toEqual([listIdA])

            await device.backgroundModules.customLists.insertPageToList({
                url: currentPageUrl,
                id: listIdB,
                skipPageIndexing: true,
            })
            await logic.init()
            expect(logic.state.pageListIds).toEqual([listIdA, listIdB])
        },
        { shouldSkip: true },
    )

    it('should be able to toggle PDF reader enabled state', async ({
        device,
    }) => {
        const { logic, syncSettingsStore } = await setupTest(device)

        expect(logic.state.isPDFReaderEnabled).toBe(false)
        expect(
            await syncSettingsStore.pdfIntegration.get('shouldAutoOpen'),
        ).toBe(null)
        await logic.processEvent('togglePDFReaderEnabled', null)
        expect(logic.state.isPDFReaderEnabled).toBe(true)
        expect(
            await syncSettingsStore.pdfIntegration.get('shouldAutoOpen'),
        ).toBe(true)
        await logic.processEvent('togglePDFReaderEnabled', null)
        expect(logic.state.isPDFReaderEnabled).toBe(false)
        expect(
            await syncSettingsStore.pdfIntegration.get('shouldAutoOpen'),
        ).toBe(false)
    })

    it(
        'should be able to toggle the Memex PDF viewer ',
        async ({ device }) => {
            let openedPage: string
            const { logic } = await setupTest(device, {
                openPage: (url) => {
                    openedPage = url
                },
            })

            await logic.init()
            expect(openedPage).toBe(undefined)
            await logic.processEvent('togglePDFReader', null)
            expect(openedPage).toBe(TEST_EXT_PAGE + '?file=' + DEFAULT_PAGE)
            await logic.processEvent('togglePDFReader', null)
            expect(openedPage).toBe(DEFAULT_PAGE)
        },
        { shouldSkip: true },
    )

    it(
        'should be able to add and remove page lists',
        async ({ device }) => {
            const { logic } = await setupTest(device)

            await logic.init()
            expect(logic.state.pageListIds).toEqual([])
            await logic.processEvent('addPageList', { listId: 1 })
            expect(logic.state.pageListIds).toEqual([1])
            await logic.processEvent('addPageList', { listId: 2 })
            expect(logic.state.pageListIds).toEqual([1, 2])
            await logic.processEvent('delPageList', { listId: 2 })
            expect(logic.state.pageListIds).toEqual([1])
            await logic.processEvent('delPageList', { listId: 1 })
            expect(logic.state.pageListIds).toEqual([])
        },
        { shouldSkip: true },
    )
})
