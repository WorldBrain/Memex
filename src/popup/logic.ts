import type { Tabs, Runtime, Extension } from 'webextension-polyfill'
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
import type { PageIndexingInterface } from 'src/page-indexing/background/types'
import { getCurrentTab } from './utils'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type { AnnotationInterface } from 'src/annotations/background/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { setUserContext as setSentryUserContext } from 'src/util/raven'
import { AnnotationsSidebarInPageEventEmitter } from 'src/sidebar/annotations-sidebar/types'

export interface Dependencies {
    extensionAPI: Pick<Extension.Static, 'isAllowedFileSchemeAccess'>
    tabsAPI: Pick<Tabs.Static, 'create' | 'query' | 'update'>
    runtimeAPI: Pick<Runtime.Static, 'getURL'>
    syncSettings: SyncSettingsStore<'pdfIntegration' | 'extension'>
    customListsBG: RemoteCollectionsInterface
    pdfIntegrationBG: PDFRemoteInterface
    pageIndexingBG: PageIndexingInterface<'caller'>
    analyticsBG: AnalyticsCoreInterface
    annotationsBG: AnnotationInterface<'provider'>
    authBG: AuthRemoteFunctionsInterface
}

export interface Event {
    togglePDFReader: null
    togglePDFReaderEnabled: null
    addPageList: { listId: number }
    delPageList: { listId: number }
    showUpgradeNotif: boolean
}

export interface State {
    pageListIds: number[]
    pageListNames: string[]
    loadState: UITaskState
    currentTabFullUrl: string
    identifierFullUrl: string
    /** In the case of a PDF, contains the URL to the web-available PDF. Else is just the full tab URL. */
    underlyingResourceUrl: string
    shouldShowTagsUIs: boolean
    isPDFReaderEnabled: boolean
    isFileAccessAllowed: boolean
    showAutoSaved: boolean
    analyticsBG: AnalyticsCoreInterface
    isSavedPage: boolean
    showUpgradeNotif: boolean
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
        pageListNames: [],
        currentTabFullUrl: '',
        identifierFullUrl: '',
        underlyingResourceUrl: '',
        loadState: 'pristine',
        shouldShowTagsUIs: false,
        isPDFReaderEnabled: false,
        isFileAccessAllowed: false,
        showAutoSaved: false,
        analyticsBG: null,
        isSavedPage: false,
        showUpgradeNotif: false,
    })

    async init() {
        const {
            authBG,
            tabsAPI,
            syncSettings,
            runtimeAPI,
            extensionAPI,
            customListsBG,
            analyticsBG,
            pageIndexingBG,
            annotationsBG,
        } = this.dependencies

        await loadInitial(this, async () => {
            authBG
                .getCurrentUser()
                .then((currentUser) => setSentryUserContext(currentUser))
            const currentTab = await getCurrentTab({ runtimeAPI, tabsAPI })
            if (
                currentTab.url === 'about:blank' ||
                currentTab.url.startsWith('chrome') ||
                currentTab.url.startsWith('moz-extension') ||
                currentTab.url.startsWith('about:')
            ) {
            } else {
                const identifier = await pageIndexingBG.waitForContentIdentifier(
                    {
                        tabId: currentTab.id,
                        fullUrl: currentTab.url,
                    },
                )
                const isFileAccessAllowed = await extensionAPI.isAllowedFileSchemeAccess()

                // const [isPDFReaderEnabled] = await Promise.all([
                //     syncSettings.pdfIntegration.get('shouldAutoOpen'),
                // ])

                this.emitMutation({
                    analyticsBG: { $set: analyticsBG },
                    currentTabFullUrl: { $set: currentTab.originalUrl },
                    identifierFullUrl: { $set: identifier.fullUrl },
                    underlyingResourceUrl: { $set: currentTab.url },
                    isPDFReaderEnabled: { $set: false },
                    isFileAccessAllowed: { $set: isFileAccessAllowed },
                })

                const pageListIds = await customListsBG.fetchPageLists({
                    url: identifier.fullUrl,
                })

                let pageListNames = []
                for (let id of pageListIds) {
                    const list = await customListsBG.fetchListById({ id: id })
                    pageListNames.push(list.name)
                }

                const isSavedPage = await this.loadBookmarkState(
                    identifier.fullUrl,
                )

                this.emitMutation({
                    pageListIds: { $set: pageListIds },
                    pageListNames: { $set: pageListNames },
                    isSavedPage: { $set: isSavedPage },
                })
            }
        })
    }

    loadBookmarkState = async (fullUrl: string) => {
        const pageTitle = await this.dependencies.pageIndexingBG.getTitleForPage(
            {
                fullPageUrl: fullUrl,
            },
        )
        if (pageTitle && pageTitle.length > 0) {
            return true
        } else {
            return false
        }
    }

    togglePDFReader: EventHandler<'togglePDFReader'> = async ({
        previousState: { currentTabFullUrl },
    }) => {
        const { runtimeAPI, tabsAPI, pdfIntegrationBG } = this.dependencies
        const [currentTab] = await tabsAPI.query({
            active: true,
            currentWindow: true,
        })

        let nextPageUrl: string
        if (isUrlPDFViewerUrl(currentTabFullUrl, { runtimeAPI })) {
            nextPageUrl = decodeURIComponent(
                currentTabFullUrl.split('?file=')[1].toString(),
            )
            await pdfIntegrationBG.doNotOpenPdfViewerForNextPdf()
        } else {
            nextPageUrl = constructPDFViewerUrl(currentTabFullUrl, {
                runtimeAPI,
            })
            await pdfIntegrationBG.openPdfViewerForNextPdf()
        }

        await tabsAPI.update(currentTab.id, { url: nextPageUrl })
        this.emitMutation({ currentTabFullUrl: { $set: nextPageUrl } })
    }

    showUpgradeNotif: EventHandler<'showUpgradeNotif'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({ showUpgradeNotif: { $set: event } })
    }
    addPageList: EventHandler<'addPageList'> = async ({
        event,
        previousState,
    }) => {
        const pageListIdsSet = new Set(previousState.pageListIds)
        pageListIdsSet.add(event.listId)
        const list = await this.dependencies.customListsBG.fetchListById({
            id: event.listId,
        })
        const pageListNames = [...previousState.pageListNames, list.name]

        this.emitMutation({
            pageListIds: { $set: [...pageListIdsSet] },
            showAutoSaved: { $set: true },
            pageListNames: { $set: pageListNames },
        })
    }

    delPageList: EventHandler<'delPageList'> = async ({
        event,
        previousState,
    }) => {
        const pageListIdsSet = new Set(previousState.pageListIds)
        pageListIdsSet.delete(event.listId)
        const list = await this.dependencies.customListsBG.fetchListById({
            id: event.listId,
        })

        // Filter out the list name from the array
        const pageListNames = previousState.pageListNames.filter(
            (name) => name !== list.name,
        )

        this.emitMutation({
            pageListIds: { $set: [...pageListIdsSet] },
            showAutoSaved: { $set: true },
            pageListNames: { $set: pageListNames },
        })
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
    }
}
