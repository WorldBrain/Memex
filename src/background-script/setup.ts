import { Browser } from 'webextension-polyfill-ts'
import StorageManager from '@worldbrain/storex'
import { SignalTransportFactory } from '@worldbrain/memex-common/lib/sync'
import NotificationBackground from 'src/notifications/background'
import SocialBackground from 'src/social-integration/background'
import DirectLinkingBackground from 'src/direct-linking/background'
import ActivityLoggerBackground, {
    TabManager,
} from 'src/activity-logger/background'
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
import CopyPasterBackground from 'src/overview/copy-paster/background'
import { ServerStorage } from 'src/storage/types'
import ContentSharingBackground from 'src/content-sharing/background'

export interface BackgroundModules {
    auth: AuthBackground
    analytics: AnalyticsBackground
    notifications: NotificationBackground
    social: SocialBackground
    activityLogger: ActivityLoggerBackground
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
    pageFetchBacklog: PageFetchBacklogBackground
    storexHub: StorexHubBackground
    copyPaster: CopyPasterBackground
    contentSharing: ContentSharingBackground
}

export function createBackgroundModules(options: {
    storageManager: StorageManager
    browserAPIs: Browser
    getServerStorage: () => Promise<ServerStorage>
    signalTransportFactory: SignalTransportFactory
    getSharedSyncLog: () => Promise<SharedSyncLog>
    localStorageChangesManager: StorageChangesManager
    fetchPageDataProcessor: FetchPageProcessor
    tabManager?: TabManager
    auth?: AuthBackground
    analyticsManager: Analytics
    authOptions?: { devAuthState: DevAuthState }
    includePostSyncProcessor?: boolean
    disableSyncEnryption?: boolean
    getIceServers?: () => Promise<string[]>
}): BackgroundModules {
    const { storageManager } = options
    const tabManager = options.tabManager || new TabManager()

    const analytics = new AnalyticsBackground(options.analyticsManager, {
        localBrowserStorage: options.browserAPIs.storage.local,
    })

    const bookmarks = new BookmarksBackground({ storageManager })
    const pages = new PageIndexingBackground({
        storageManager,
        bookmarksStorage: bookmarks.storage,
        fetchPageData: options.fetchPageDataProcessor,
    })
    const searchIndex = combineSearchIndex({
        getDb: async () => storageManager,
        pages,
        bookmarksStorage: bookmarks.storage,
        tabManager,
    })
    const activityLogger = new ActivityLoggerBackground({
        searchIndex,
        browserAPIs: options.browserAPIs,
        tabManager,
        pageStorage: pages.storage,
    })

    const search = new SearchBackground({
        storageManager,
        pages,
        idx: searchIndex,
        tabMan: tabManager,
        browserAPIs: options.browserAPIs,
    })

    const tags = new TagsBackground({
        storageManager,
        pageStorage: pages.storage,
        searchIndex,
        queryTabs: bindMethod(options.browserAPIs.tabs, 'query'),
        windows: options.browserAPIs.windows,
        searchBackgroundModule: search,
        analytics,
        localBrowserStorage: options.browserAPIs.storage.local,
    })

    const notifications = new NotificationBackground({ storageManager })

    const jobScheduler = new JobSchedulerBackground({
        storagePrefix: JobScheduler.STORAGE_PREFIX,
        storageAPI: options.browserAPIs.storage,
        alarmsAPI: options.browserAPIs.alarms,
        notifications,
        jobs,
    })

    const social = new SocialBackground({ storageManager })
    const bgScript = new BackgroundScript({
        storageManager,
        storageChangesMan: options.localStorageChangesManager,
        notifsBackground: notifications,
        loggerBackground: activityLogger,
    })

    const auth =
        options.auth ||
        new AuthBackground({
            ...createAuthDependencies({
                ...options.authOptions,
                redirectUrl: subscriptionRedirect,
            }),
            scheduleJob: jobScheduler.scheduler.scheduleJobOnce.bind(
                jobScheduler.scheduler,
            ),
            getUserManagement: async () =>
                (await options.getServerStorage()).storageModules
                    .userManagement,
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

    const postReceiveProcessor = options.includePostSyncProcessor
        ? new PostReceiveProcessor({
              pages,
              pageFetchBacklog,
              fetchPageData: options.fetchPageDataProcessor,
          }).processor
        : undefined

    const customLists = new CustomListBackground({
        storageManager,
        queryTabs: bindMethod(options.browserAPIs.tabs, 'query'),
        windows: options.browserAPIs.windows,
        searchIndex: search.searchIndex,
        pageStorage: pages.storage,
        localBrowserStorage: options.browserAPIs.storage.local,
    })

    return {
        auth,
        social,
        analytics,
        jobScheduler,
        notifications,
        activityLogger,
        connectivityChecker,
        directLinking: new DirectLinkingBackground({
            browserAPIs: options.browserAPIs,
            storageManager,
            socialBg: social,
            searchIndex: search.searchIndex,
            pageStorage: pages.storage,
        }),
        search,
        eventLog: new EventLogBackground({ storageManager }),
        customLists,
        tags,
        bookmarks,
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
                        url: bookmark.normalizedUrl,
                        time: bookmark.time,
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
                                url: params.normalizedUrl,
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
        pages,
        bgScript,
        pageFetchBacklog,
        contentScripts: new ContentScriptsBackground({
            getTab: bindMethod(options.browserAPIs.tabs, 'get'),
            injectScriptInTab: (tabId, injection) =>
                options.browserAPIs.tabs.executeScript(tabId, injection),
        }),
        inPageUI: new InPageUIBackground({
            queryTabs: bindMethod(options.browserAPIs.tabs, 'query'),
            createContextMenuEntry: bindMethod(
                options.browserAPIs.contextMenus,
                'create',
            ),
        }),
        copyPaster: new CopyPasterBackground({
            storageManager,
        }),
        contentSharing: new ContentSharingBackground({
            storageManager,
            customLists: customLists.storage,
            auth,
            getContentSharing: async () =>
                (await options.getServerStorage()).storageModules
                    .contentSharing,
        }),
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
        searchIndex: backgroundModules.search.searchIndex,
        tagsModule: backgroundModules.tags,
        customListsModule: backgroundModules.customLists,
    })

    backgroundModules.auth.registerRemoteEmitter()
    backgroundModules.auth.setupRequestInterceptor()
    backgroundModules.notifications.setupRemoteFunctions()
    backgroundModules.social.setupRemoteFunctions()
    backgroundModules.directLinking.setupRemoteFunctions()
    backgroundModules.directLinking.setupRequestInterceptor()
    backgroundModules.activityLogger.setupWebExtAPIHandlers()
    backgroundModules.activityLogger.setupRemoteFunctions()
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
        contentSharing: backgroundModules.contentSharing.storage,
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
