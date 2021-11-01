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

export interface Dependencies {
    tabsAPI: Pick<Tabs.Static, 'create' | 'query'>
    runtimeAPI: Pick<Runtime.Static, 'getURL'>
    syncSettings: SyncSettingsStore<'pdfIntegration'>
    pdfIntegrationBG: PDFRemoteInterface
}

export interface Event {
    openPDFReader: null
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

    openPDFReader: EventHandler<'openPDFReader'> = async ({
        previousState: { currentPageUrl },
    }) => {
        const { runtimeAPI, tabsAPI } = this.dependencies

        if (isUrlPDFViewerUrl(currentPageUrl, { runtimeAPI })) {
            console.log('already on it')
            return
        }

        const pdfViewerUrl = constructPDFViewerUrl(currentPageUrl, {
            runtimeAPI,
        })
        await tabsAPI.create({ url: pdfViewerUrl })
    }

    togglePDFReaderEnabled: EventHandler<'togglePDFReaderEnabled'> = async ({
        previousState,
    }) => {
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
