import type { Tabs, Runtime, Extension } from 'webextension-polyfill-ts'
import type { UIEventHandler } from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import {
    UILogic,
    loadInitial,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import type { SyncSettingsStore } from 'src/sync-settings/util'
import type { PDFRemoteInterface } from 'src/pdf/background/types'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { constructPDFViewerUrl, isUrlPDFViewerUrl } from 'src/pdf/util'

export interface Dependencies {
    extensionAPI: Pick<Extension.Static, 'isAllowedFileSchemeAccess'>
    tabsAPI: Pick<Tabs.Static, 'create' | 'query' | 'update'>
    runtimeAPI: Pick<Runtime.Static, 'getURL'>
    syncSettings: SyncSettingsStore<'pdfIntegration' | 'extension'>
    customListsBG: RemoteCollectionsInterface
    pdfIntegrationBG: PDFRemoteInterface
}

export interface Event {
    togglePDFReader: null
    togglePDFReaderEnabled: null
    addPageList: { listId: number }
    delPageList: { listId: number }
}

export interface State {
    pageListIds: number[]
    loadState: UITaskState
    currentPageUrl: string
    shouldShowTagsUIs: boolean
    isPDFReaderEnabled: boolean
    isFileAccessAllowed: boolean
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
        pageListIds: [],
        currentPageUrl: '',
        loadState: 'pristine',
        shouldShowTagsUIs: false,
        isPDFReaderEnabled: false,
        isFileAccessAllowed: false,
    })

    async init() {
        const {
            tabsAPI,
            syncSettings,
            extensionAPI,
            customListsBG,
        } = this.dependencies

        await loadInitial(this, async () => {
            const [areTagsMigrated, isPDFReaderEnabled] = await Promise.all([
                syncSettings.extension.get('areTagsMigratedToSpaces'),
                syncSettings.pdfIntegration.get('shouldAutoOpen'),
            ])
            const [currentTab] = await tabsAPI.query({
                active: true,
                currentWindow: true,
            })

            const pageListIds =
                currentTab?.url != null
                    ? await customListsBG.fetchPageLists({
                          url: currentTab.url,
                      })
                    : []

            const isFileAccessAllowed = await extensionAPI.isAllowedFileSchemeAccess()
            this.emitMutation({
                pageListIds: { $set: pageListIds },
                currentPageUrl: { $set: currentTab?.url },
                shouldShowTagsUIs: { $set: !areTagsMigrated },
                isPDFReaderEnabled: { $set: isPDFReaderEnabled },
                isFileAccessAllowed: { $set: isFileAccessAllowed },
            })
        })
    }

    togglePDFReader: EventHandler<'togglePDFReader'> = async ({
        previousState: { currentPageUrl },
    }) => {
        const { runtimeAPI, tabsAPI, pdfIntegrationBG } = this.dependencies
        const [currentTab] = await tabsAPI.query({
            active: true,
            currentWindow: true,
        })

        let nextPageUrl: string
        if (isUrlPDFViewerUrl(currentPageUrl, { runtimeAPI })) {
            nextPageUrl = decodeURIComponent(
                currentPageUrl.split('?file=')[1].toString(),
            )
            await pdfIntegrationBG.doNotOpenPdfViewerForNextPdf()
        } else {
            nextPageUrl = constructPDFViewerUrl(currentPageUrl, {
                runtimeAPI,
            })
            await pdfIntegrationBG.openPdfViewerForNextPdf()
        }

        await tabsAPI.update(currentTab.id, { url: nextPageUrl })
        this.emitMutation({ currentPageUrl: { $set: nextPageUrl } })
    }

    addPageList: EventHandler<'addPageList'> = async ({
        event,
        previousState,
    }) => {
        const pageListIdsSet = new Set(previousState.pageListIds)
        pageListIdsSet.add(event.listId)
        this.emitMutation({ pageListIds: { $set: [...pageListIdsSet] } })
    }

    delPageList: EventHandler<'delPageList'> = async ({
        event,
        previousState,
    }) => {
        const pageListIdsSet = new Set(previousState.pageListIds)
        pageListIdsSet.delete(event.listId)
        this.emitMutation({ pageListIds: { $set: [...pageListIdsSet] } })
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
