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
            create: args?.openPage
                ? ({ url }) => args.openPage(url) as any
                : browserAPIs.tabs.create,
        },
        runtimeAPI: {
            getURL: () => TEST_EXT_PAGE,
        },
        syncSettings: syncSettingsStore,
        currentPageUrl: args?.currentPageUrl ?? DEFAULT_PAGE,
    })

    const logic = createElement<State, Event>(_logic)

    return { _logic, logic, syncSettingsStore }
}

describe('Popup UI logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should hydrate PDF reader enabled state based on sync settings', async ({
        device,
    }) => {
        const { logic, syncSettingsStore } = await setupTest(device)

        await syncSettingsStore.pdfIntegration.set('shouldAutoOpen', true)
        expect(logic.state.isPDFReaderEnabled).toBe(false)
        expect(logic.state.loadState).toBe('pristine')
        await logic.init()
        expect(logic.state.isPDFReaderEnabled).toBe(true)
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

    it('should be able to open the current page in the Memex PDF viewer', async ({
        device,
    }) => {
        let openedPage: string
        const { logic } = await setupTest(device, {
            openPage: (url) => {
                openedPage = url
            },
        })

        expect(openedPage).toBe(undefined)
        await logic.processEvent('openPDFReader', null)
        expect(openedPage).toBe(TEST_EXT_PAGE + '?file=' + DEFAULT_PAGE)
    })
})
