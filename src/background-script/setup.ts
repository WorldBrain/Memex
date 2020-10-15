import { Browser } from 'webextension-polyfill-ts'
import StorageManager from '@worldbrain/storex'
import { SignalTransportFactory } from '@worldbrain/memex-common/lib/sync'
import NotificationBackground from 'src/notifications/background'
import SocialBackground from 'src/social-integration/background'
import DirectLinkingBackground from 'src/annotations/background'
import SearchBackground from 'src/search/background'
import EventLogBackground from 'src/analytics/internal/background'
import JobSchedulerBackground from 'src/job-scheduler/background'
import { jobs } from 'src/job-scheduler/background/jobs'
import CustomListBackground from 'src/custom-lists/background'
import TagsBackground from 'src/tags/background'
import BookmarksBackground from 'src/bookmarks/background'
import * as backup from '../backup-restore/background'
import * as backupStorage from '../backup-restore/background/storage'
import {
    registerModuleMapCollections,
    StorageModule,
} from '@worldbrain/storex-pattern-modules'
import { SharedSyncLog } from '@worldbrain/storex-sync/lib/shared-sync-log'
import { setupBlacklistRemoteFunctions } from 'src/blacklist/background'
import {
    setImportStateManager,
    ImportStateManager,
} from 'src/imports/background/state-manager'
import { setupImportBackgroundModule } from 'src/imports/background'
import SyncBackground from 'src/sync/background'
import { PostReceiveProcessor } from 'src/sync/background/post-receive-processor'
import BackgroundScript from '.'
import alarms from './alarms'
import { setupNotificationClickListener } from 'src/util/notifications'
import { StorageChangesManager } from 'src/util/storage-changes'
import { AuthBackground } from 'src/authentication/background'
import {
    createAuthDependencies,
    DevAuthState,
} from 'src/authentication/background/setup'
import { FeatureOptIns } from 'src/features/background/feature-opt-ins'
import { FeaturesBeta } from 'src/features/background/feature-beta'
import { PageFetchBacklogBackground } from 'src/page-fetch-backlog/background'
import { ConnectivityCheckerBackground } from 'src/connectivity-checker/background'
import { FetchPageProcessor } from 'src/page-analysis/background/types'
import { PageIndexingBackground } from 'src/page-indexing/background'
import { combineSearchIndex } from 'src/search/search-index'
import { StorexHubBackground } from 'src/storex-hub/background'
import { JobScheduler } from 'src/job-scheduler/background/job-scheduler'
import { bindMethod } from 'src/util/functions'
import { ContentScriptsBackground } from 'src/content-scripts/background'
import { InPageUIBackground } from 'src/in-page-ui/background'
import { AnalyticsBackground } from 'src/analytics/background'
import { Analytics } from 'src/analytics/types'
import { subscriptionRedirect } from 'src/authentication/background/redirect'
import { PipelineRes } from 'src/search'
import CopyPasterBackground from 'src/copy-paster/background'
import { ReaderBackground } from 'src/reader/background'
import { ServerStorage } from 'src/storage/types'
import ContentSharingBackground from 'src/content-sharing/background'
import { getFirebase } from 'src/util/firebase-app-initialized'
import TabManagementBackground from 'src/tab-management/background'
import { runInTab } from 'src/util/webextensionRPC'
import { PageAnalyzerInterface } from 'src/page-analysis/types'
import { TabManager } from 'src/tab-management/background/tab-manager'
import { ReadwiseBackground } from 'src/readwise-integration/background'
import { type } from 'openpgp'

export interface BackgroundModules {
    auth: AuthBackground
    analytics: AnalyticsBackground
    notifications: NotificationBackground
    social: SocialBackground
    connectivityChecker: ConnectivityCheckerBackground
    directLinking: DirectLinkingBackground
    pages: PageIndexingBackground
    search: SearchBackground
    eventLog: EventLogBackground
    customLists: CustomListBackground
    jobScheduler: JobSchedulerBackground
    tags: TagsBackground
    bookmarks: BookmarksBackground
    backupModule: backup.BackupBackgroundModule
    sync: SyncBackground
    bgScript: BackgroundScript
    contentScripts: ContentScriptsBackground
    inPageUI: InPageUIBackground
    features: FeatureOptIns
    featuresBeta: FeaturesBeta
    pageFetchBacklog: PageFetchBacklogBackground
    storexHub: StorexHubBackground
    copyPaster: CopyPasterBackground
    readable: ReaderBackground
    contentSharing: ContentSharingBackground
    tabManagement: TabManagementBackground
    readwise: ReadwiseBackground
}

const globalFetch: typeof fetch =
    typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null

export function createBackgroundModules(options: {
    storageManager: StorageManager
    browserAPIs: Browser
    getServerStorage: () => Promise<ServerStorage>
    signalTransportFactory: SignalTransportFactory
    getSharedSyncLog: () => Promise<SharedSyncLog>
    localStorageChangesManager: StorageChangesManager
    fetchPageDataProcessor?: FetchPageProcessor
    tabManager?: TabManager
    auth?: AuthBackground
    analyticsManager: Analytics
    authOptions?: { devAuthState: DevAuthState }
    disableSyncEnryption?: boolean
    getIceServers?: () => Promise<string[]>
    getNow?: () => number
    fetch?: typeof fetch
}): BackgroundModules {
    const getNow = options.getNow ?? (() => Date.now())
    const fetch = options.fetch ?? globalFetch

    const { storageManager } = options
    const tabManager = options.tabManager || new TabManager()
    const tabManagement = new TabManagementBackground({
        tabManager,
        browserAPIs: options.browserAPIs,
        extractRawPageContent: (tabId) =>
            runInTab<PageAnalyzerInterface>(tabId).extractRawPageContent(),
    })

    const analytics = new AnalyticsBackground(options.analyticsManager, {
        localBrowserStorage: options.browserAPIs.storage.local,
    })

    const pages = new PageIndexingBackground({
        storageManager,
        fetchPageData: options.fetchPageDataProcessor,
        tabManagement,
        getNow,
    })
    tabManagement.events.on('tabRemoved', (event) => {
        pages.handleTabClose(event)
    })
    const bookmarks = new BookmarksBackground({
        storageManager,
        pages,
        tabManager,
        analytics,
        browserAPIs: options.browserAPIs,
    })
    const searchIndex = combineSearchIndex({
        getDb: async () => storageManager,
    })

    const search = new SearchBackground({
        storageManager,
        pages,
        idx: searchIndex,
        browserAPIs: options.browserAPIs,
        bookmarks,
    })

    const tags = new TagsBackground({
        storageManager,
        pages,
        tabManagement,
        queryTabs: bindMethod(options.browserAPIs.tabs, 'query'),
        windows: options.browserAPIs.windows,
        searchBackgroundModule: search,
        analytics,
        localBrowserStorage: options.browserAPIs.storage.local,
    })

    const reader = new ReaderBackground({ storageManager })

    const notifications = new NotificationBackground({ storageManager })

    const jobScheduler = new JobSchedulerBackground({
        storagePrefix: JobScheduler.STORAGE_PREFIX,
        storageAPI: options.browserAPIs.storage,
        alarmsAPI: options.browserAPIs.alarms,
        notifications,
        jobs,
    })

    const social = new SocialBackground({ storageManager })

    const customLists = new CustomListBackground({
        analytics,
        storageManager,
        tabManagement,
        queryTabs: bindMethod(options.browserAPIs.tabs, 'query'),
        windows: options.browserAPIs.windows,
        searchIndex: search.searchIndex,
        pages,
        localBrowserStorage: options.browserAPIs.storage.local,
    })

    const directLinking = new DirectLinkingBackground({
        browserAPIs: options.browserAPIs,
        storageManager,
        socialBg: social,
        pages,
        analytics,
    })

    const auth =
        options.auth ||
        new AuthBackground({
            ...createAuthDependencies({
                ...options.authOptions,
                redirectUrl: subscriptionRedirect,
            }),
            localStorageArea: options.browserAPIs.storage.local,
            scheduleJob: jobScheduler.scheduler.scheduleJobOnce.bind(
                jobScheduler.scheduler,
            ),
            backendFunctions: {
                registerBetaUser: async (params) => {
                    const firebase = getFirebase()
                    const callable = firebase
                        .functions()
                        .httpsCallable('registerBetaUser')
                    await callable(params)
                },
            },
            getUserManagement: async () =>
                (await options.getServerStorage()).storageModules
                    .userManagement,
        })

    const contentSharing = new ContentSharingBackground({
        storageManager,
        customLists: customLists.storage,
        annotationStorage: directLinking.annotationStorage,
        auth,
        analytics: options.analyticsManager,
        getContentSharing: async () =>
            (await options.getServerStorage()).storageModules.contentSharing,
    })

    const readwise = new ReadwiseBackground({
        storageManager,
        browserStorage: options.browserAPIs.storage.local,
        fetch,
        getFullPageUrl: async (normalizedUrl) =>
            (await pages.storage.getPage(normalizedUrl))?.fullUrl,
        getAnnotationsByPks: async (pks) => {
            return directLinking.annotationStorage.getAnnotations(pks)
        },
        streamAnnotations: async function* () {
            yield* await storageManager.operation(
                'streamObjects',
                'annotations',
            )
        },
    })

    const copyPaster = new CopyPasterBackground({
        storageManager,
        contentSharing,
        search,
    })

    const bgScript = new BackgroundScript({
        storageManager,
        tabManagement,
        storageChangesMan: options.localStorageChangesManager,
        copyPasterBackground: copyPaster,
        notifsBackground: notifications,
    })

    const connectivityChecker = new ConnectivityCheckerBackground({
        xhr: new XMLHttpRequest(),
    })

    const storePageContent = async (content: PipelineRes): Promise<void> => {
        await pages.storage.createOrUpdatePage(content)
    }
    const pageFetchBacklog = new PageFetchBacklogBackground({
        storageManager,
        connectivityChecker,
        fetchPageData: options.fetchPageDataProcessor,
        storePageContent,
    })

    const postReceiveProcessor =
        options.fetchPageDataProcessor != null
            ? new PostReceiveProcessor({
                  pages,
                  pageFetchBacklog,
                  fetchPageData: options.fetchPageDataProcessor,
              }).processor
            : undefined

    return {
        auth,
        social,
        analytics,
        jobScheduler,
        notifications,
        connectivityChecker,
        readable: reader,
        directLinking,
        search,
        eventLog: new EventLogBackground({ storageManager }),
        customLists,
        tags,
        bookmarks,
        tabManagement,
        readwise,
        backupModule: new backup.BackupBackgroundModule({
            storageManager,
            searchIndex: search.searchIndex,
            backupInfoStorage: new backupStorage.LocalBackupInfoStorage(),
            notifications,
            checkAuthorizedForAutoBackup: async () =>
                auth.remoteFunctions.isAuthorizedForFeature('backup'),
        }),
        sync: new SyncBackground({
            signalTransportFactory: options.signalTransportFactory,
            disableEncryption: options.disableSyncEnryption,
            getSharedSyncLog: options.getSharedSyncLog,
            getIceServers: options.getIceServers,
            browserAPIs: options.browserAPIs,
            appVersion: process.env.VERSION,
            auth: auth.authService,
            postReceiveProcessor,
            storageManager,
            analytics,
        }),
        storexHub: new StorexHubBackground({
            storageManager,
            localBrowserStorage: options.browserAPIs.storage.local,
            fetchPageData: options.fetchPageDataProcessor,
            storePageContent,
            addVisit: (visit) =>
                pages.addVisit(visit.normalizedUrl, visit.time),
            addBookmark: async (bookmark) => {
                if (
                    !(await bookmarks.storage.pageHasBookmark(
                        bookmark.normalizedUrl,
                    ))
                ) {
                    await bookmarks.addBookmark({
                        fullUrl: bookmark.normalizedUrl,
                        timestamp: bookmark.time,
                    })
                }
            },
            addTags: async (params) => {
                const existingTags = await tags.storage.fetchPageTags({
                    url: params.normalizedUrl,
                })
                await Promise.all(
                    params.tags.map(async (tag) => {
                        if (!existingTags.includes(tag)) {
                            await tags.addTagToPage({
                                url: params.fullUrl,
                                tag,
                            })
                        }
                    }),
                )
            },
            addToLists: async (params) => {
                const existingEntries = await customLists.storage.fetchListIdsByUrl(
                    params.normalizedUrl,
                )
                await Promise.all(
                    params.lists.map(async (listId) => {
                        if (!existingEntries.includes(listId)) {
                            await customLists.storage.insertPageToList({
                                listId,
                                pageUrl: params.normalizedUrl,
                                fullUrl: params.fullUrl,
                            })
                        }
                    }),
                )
            },
        }),
        features: new FeatureOptIns(),
        featuresBeta: new FeaturesBeta(),
        pages,
        bgScript,
        pageFetchBacklog,
        contentScripts: new ContentScriptsBackground({
            webNavigation: options.browserAPIs.webNavigation,
            getURL: bindMethod(options.browserAPIs.runtime, 'getURL'),
            getTab: bindMethod(options.browserAPIs.tabs, 'get'),
            injectScriptInTab: (tabId, injection) =>
                options.browserAPIs.tabs.executeScript(tabId, injection),
        }),
        inPageUI: new InPageUIBackground({
            queryTabs: bindMethod(options.browserAPIs.tabs, 'query'),
            contextMenuAPI: options.browserAPIs.contextMenus,
        }),
        copyPaster,
        contentSharing,
    }
}

export async function setupBackgroundModules(
    backgroundModules: BackgroundModules,
    storageManager: StorageManager,
) {
    backgroundModules.bgScript.setupWebExtAPIHandlers()

    setImportStateManager(
        new ImportStateManager({
            storageManager,
        }),
    )
    setupImportBackgroundModule({
        pages: backgroundModules.pages,
        tagsModule: backgroundModules.tags,
        customListsModule: backgroundModules.customLists,
        bookmarks: backgroundModules.bookmarks,
    })

    backgroundModules.auth.registerRemoteEmitter()
    backgroundModules.auth.setupRequestInterceptor()
    backgroundModules.notifications.setupRemoteFunctions()
    backgroundModules.social.setupRemoteFunctions()
    backgroundModules.directLinking.setupRemoteFunctions()
    backgroundModules.directLinking.setupRequestInterceptor()
    backgroundModules.search.setupRemoteFunctions()
    backgroundModules.eventLog.setupRemoteFunctions()
    backgroundModules.backupModule.setBackendFromStorage()
    backgroundModules.backupModule.setupRemoteFunctions()
    backgroundModules.backupModule.startRecordingChangesIfNeeded()
    backgroundModules.bgScript.setupRemoteFunctions()
    backgroundModules.contentScripts.setupRemoteFunctions()
    backgroundModules.inPageUI.setupRemoteFunctions()
    backgroundModules.bgScript.setupAlarms(alarms)
    backgroundModules.pageFetchBacklog.setupBacklogProcessing()
    backgroundModules.bookmarks.setupBookmarkListeners()
    backgroundModules.tabManagement.setupRemoteFunctions()
    backgroundModules.readwise.setupRemoteFunctions()
    setupNotificationClickListener()
    setupBlacklistRemoteFunctions()
    backgroundModules.backupModule.storage.setupChangeTracking()

    await backgroundModules.sync.setup()
    await backgroundModules.analytics.setup()
    await backgroundModules.jobScheduler.setup()
    backgroundModules.sync.registerRemoteEmitter()
}

export function getBackgroundStorageModules(
    backgroundModules: BackgroundModules,
): { [moduleName: string]: StorageModule } {
    return {
        pageFetchBacklog: backgroundModules.pageFetchBacklog.storage,
        annotations: backgroundModules.directLinking.annotationStorage,
        notifications: backgroundModules.notifications.storage,
        customList: backgroundModules.customLists.storage,
        bookmarks: backgroundModules.bookmarks.storage,
        backup: backgroundModules.backupModule.storage,
        eventLog: backgroundModules.eventLog.storage,
        search: backgroundModules.search.storage,
        social: backgroundModules.social.storage,
        tags: backgroundModules.tags.storage,
        clientSyncLog: backgroundModules.sync.clientSyncLog,
        syncInfo: backgroundModules.sync.syncInfoStorage,
        pages: backgroundModules.pages.storage,
        copyPaster: backgroundModules.copyPaster.storage,
        reader: backgroundModules.readable.storage,
        contentSharing: backgroundModules.contentSharing.storage,
        readwiseActionQueue: backgroundModules.readwise.actionQueue.storage,
    }
}

export function registerBackgroundModuleCollections(
    storageManager: StorageManager,
    backgroundModules: BackgroundModules,
) {
    registerModuleMapCollections(
        storageManager.registry,
        getBackgroundStorageModules(backgroundModules),
    )
}
