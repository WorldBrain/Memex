import type { Tabs, Runtime } from 'webextension-polyfill-ts'
import type { UIEventHandler } from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import {
    UILogic,
    loadInitial,
    executeUITask,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import type { SyncSettingsStore } from 'src/sync-settings/util'
import { constructPDFViewerUrl } from 'src/pdf/util'

export interface Dependencies {
    tabsAPI: Pick<Tabs.Static, 'create'>
    runtimeAPI: Pick<Runtime.Static, 'getURL'>
    syncSettings: SyncSettingsStore<'pdfIntegration'>
    currentPageUrl: string
}

export interface Event {
    openPDFReader: null
    togglePDFReaderEnabled: null
}

export interface State {
    loadState: UITaskState
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
    })

    async init() {
        await loadInitial(this, async () => {
            const isPDFReaderEnabled = await this.dependencies.syncSettings.pdfIntegration.get(
                'shouldAutoOpen',
            )
            this.emitMutation({
                isPDFReaderEnabled: { $set: isPDFReaderEnabled },
            })
        })
    }

    openPDFReader: EventHandler<'openPDFReader'> = async ({}) => {
        const { runtimeAPI, tabsAPI, currentPageUrl } = this.dependencies
        const pdfViewerUrl = constructPDFViewerUrl(currentPageUrl, {
            runtimeAPI,
        })
        await tabsAPI.create({ url: pdfViewerUrl })
    }

    togglePDFReaderEnabled: EventHandler<'togglePDFReaderEnabled'> = async ({
        previousState,
    }) => {
        this.emitMutation({
            isPDFReaderEnabled: { $set: !previousState.isPDFReaderEnabled },
        })
        await this.dependencies.syncSettings.pdfIntegration.set(
            'shouldAutoOpen',
            !previousState.isPDFReaderEnabled,
        )
    }
}
