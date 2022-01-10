import Logic, { State, Event } from './logic'
import {
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
        pdfIntegrationBG: backgroundModules.pdfBg.remoteFunctions,
    })

    const logic = createElement<State, Event>(_logic)

    return { _logic, logic, syncSettingsStore }
}

describe('Popup UI logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should hydrate PDF reader enabled state based on sync settings+current URL on init', async ({
        device,
    }) => {
        const currentPageUrl = 'https://memex.memex'
        const { logic, syncSettingsStore } = await setupTest(device, {
            currentPageUrl,
        })

        await syncSettingsStore.pdfIntegration.set('shouldAutoOpen', true)
        expect(logic.state.isPDFReaderEnabled).toBe(false)
        expect(logic.state.currentPageUrl).toBe('')
        expect(logic.state.loadState).toBe('pristine')
        await logic.init()
        expect(logic.state.isPDFReaderEnabled).toBe(true)
        expect(logic.state.currentPageUrl).toBe(currentPageUrl)
        expect(logic.state.loadState).toBe('success')

        await syncSettingsStore.pdfIntegration.set('shouldAutoOpen', false)
        expect(logic.state.isPDFReaderEnabled).toBe(true)
        await logic.init()
        expect(logic.state.isPDFReaderEnabled).toBe(false)
    })

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

    it('should be able to toggle the Memex PDF viewer ', async ({ device }) => {
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
    })
})
