import type { Tabs, Runtime } from 'webextension-polyfill-ts'
import type { UIEventHandler } from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import {
    UILogic,
    loadInitial,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import type { SyncSettingsStore } from 'src/sync-settings/util'
import type { PDFRemoteInterface } from 'src/pdf/background/types'
import { constructPDFViewerUrl, isUrlPDFViewerUrl } from 'src/pdf/util'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'

export interface Dependencies {
    tabsAPI: Pick<Tabs.Static, 'create' | 'query' | 'update'>
    runtimeAPI: Pick<Runtime.Static, 'getURL'>
    syncSettings: SyncSettingsStore<'pdfIntegration'>
    pdfIntegrationBG: PDFRemoteInterface
}

export interface Event {
    togglePDFReader: null
    togglePDFReaderEnabled: null
}

export interface State {
    loadState: UITaskState
    currentPageUrl: string
    isPDFReaderEnabled: boolean
}

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class PopupLogic extends UILogic<State, Event> {
    constructor(private dependencies: Dependencies) {
        super()
    }

    getInitialState = (): State => ({
        loadState: 'pristine',
        isPDFReaderEnabled: false,
        currentPageUrl: '',
    })

    async init() {
        const { syncSettings, tabsAPI } = this.dependencies
        await loadInitial(this, async () => {
            const OneTimeIgnoreReaderEnabled = await getLocalStorage(
                'OneTimeIgnoreReaderEnabled',
            )
            const isPDFReaderEnabled = await syncSettings.pdfIntegration.get(
                'shouldAutoOpen',
            )
            const [currentTab] = await tabsAPI.query({
                active: true,
                currentWindow: true,
            })
            this.emitMutation({
                currentPageUrl: { $set: currentTab?.url },
                isPDFReaderEnabled: { $set: isPDFReaderEnabled },
            })
        })
    }

    togglePDFReader: EventHandler<'togglePDFReader'> = async ({
        previousState: { currentPageUrl },
    }) => {
        const { runtimeAPI, tabsAPI, pdfIntegrationBG } = this.dependencies
        const currentTab = await tabsAPI.query({
            active: true,
            currentWindow: true,
        })
        const currentTabID = currentTab[0].id

        if (isUrlPDFViewerUrl(currentPageUrl, { runtimeAPI })) {
            const originalUrl = decodeURIComponent(
                currentPageUrl.split('?file=')[1].toString(),
            )
            setLocalStorage('OneTimeIgnoreReaderEnabled', true)
            pdfIntegrationBG.doNotOpenPdfViewerForNextPdf()
            tabsAPI.update(currentTabID, { url: originalUrl })
        } else {
            const pdfViewerUrl = constructPDFViewerUrl(currentPageUrl, {
                runtimeAPI,
            })
            pdfIntegrationBG.openPdfViewerForNextPdf()
            tabsAPI.update(currentTabID, { url: pdfViewerUrl })
        }
    }

    togglePDFReaderEnabled: EventHandler<'togglePDFReaderEnabled'> = async ({
        previousState,
    }) => {
        setLocalStorage('OneTimeIgnoreReaderEnabled', false)
        const { syncSettings, pdfIntegrationBG } = this.dependencies
        this.emitMutation({
            isPDFReaderEnabled: { $set: !previousState.isPDFReaderEnabled },
        })
        await syncSettings.pdfIntegration.set(
            'shouldAutoOpen',
            !previousState.isPDFReaderEnabled,
        )
        await pdfIntegrationBG.refreshSetting()
    }
}
