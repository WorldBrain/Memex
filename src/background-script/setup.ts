import kebabCase from 'lodash/kebabCase'
import { browser, Browser } from 'webextension-polyfill-ts'
import { UAParser } from 'ua-parser-js'
import StorageManager from '@worldbrain/storex'
import { updateOrCreate } from '@worldbrain/storex/lib/utils'
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
import { firebaseService } from '@worldbrain/memex-common/lib/firebase-backend/services/client'
import { setupBlacklistRemoteFunctions } from 'src/blacklist/background'
import {
    setImportStateManager,
    ImportStateManager,
} from 'src/imports/background/state-manager'
import transformPageHTML from 'src/util/transform-page-html'
import { setupImportBackgroundModule } from 'src/imports/background'
import SyncBackground from 'src/sync/background'
import { PostReceiveProcessor } from 'src/sync/background/post-receive-processor'
import BackgroundScript from '.'
import alarms from './alarms'
import { setupNotificationClickListener } from 'src/util/notifications'
import { StorageChangesManager } from 'src/util/storage-changes'
import { AuthBackground } from 'src/authentication/background'
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
import { PipelineRes } from 'src/search'
import CopyPasterBackground from 'src/copy-paster/background'
import { ReaderBackground } from 'src/reader/background'
import { ServerStorage } from 'src/storage/types'
import ContentSharingBackground from 'src/content-sharing/background'
import ContentConversationsBackground from 'src/content-conversations/background'
import { getFirebase } from 'src/util/firebase-app-initialized'
import TabManagementBackground from 'src/tab-management/background'
import {
    runInTab,
    RemoteEventEmitter,
    RemoteEvents,
    remoteEventEmitter,
} from 'src/util/webextensionRPC'
import { PageAnalyzerInterface } from 'src/page-analysis/types'
import { TabManager } from 'src/tab-management/background/tab-manager'
import { ReadwiseBackground } from 'src/readwise-integration/background'
import pick from 'lodash/pick'
import ActivityIndicatorBackground from 'src/activity-indicator/background'
import ActivityStreamsBackground from 'src/activity-streams/background'
import { SyncSettingsBackground } from 'src/sync-settings/background'
import { Services } from 'src/services/types'
import { captureException } from 'src/util/raven'
import { PDFBackground } from 'src/pdf/background'
import { FirebaseUserMessageService } from '@worldbrain/memex-common/lib/user-messages/service/firebase'
import { UserMessageService } from '@worldbrain/memex-common/lib/user-messages/service/types'
import {
    PersonalDeviceType,
    PersonalDeviceProduct,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import { PersonalCloudBackground } from 'src/personal-cloud/background'
import {
    PersonalCloudBackend,
    PersonalCloudService,
    PersonalCloudClientStorageType,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/types'
import { BrowserSettingsStore } from 'src/util/settings'
import { LocalPersonalCloudSettings } from 'src/personal-cloud/background/types'
import { authChanges } from '@worldbrain/memex-common/lib/authentication/utils'
import FirestorePersonalCloudBackend from '@worldbrain/memex-common/lib/personal-cloud/backend/firestore'
import { getCurrentSchemaVersion } from '@worldbrain/memex-common/lib/storage/utils'
import { StoredContentType } from 'src/page-indexing/background/types'
import transformPageText from 'src/util/transform-page-text'
import { ContentSharingBackend } from '@worldbrain/memex-common/lib/content-sharing/backend'
import { SharedListRoleID } from '../../external/@worldbrain/memex-common/ts/content-sharing/types'
import type { ReadwiseSettings } from 'src/readwise-integration/background/types/settings'
import type { LocalExtensionSettings } from './types'
import { normalizeUrl } from '@worldbrain/memex-url-utils/lib/normalize/utils'
import { createSyncSettingsStore } from 'src/sync-settings/util'

export interface BackgroundModules {
    auth: AuthBackground
    analytics: AnalyticsBackground
    notifications: NotificationBackground
    social: SocialBackground
    pdfBg: PDFBackground
    connectivityChecker: ConnectivityCheckerBackground
    activityIndicator: ActivityIndicatorBackground
    directLinking: DirectLinkingBackground
    pages: PageIndexingBackground
    search: SearchBackground
    eventLog: EventLogBackground
    customLists: CustomListBackground
    jobScheduler: JobSchedulerBackground
    tags: TagsBackground
    bookmarks: BookmarksBackground
    backupModule: backup.BackupBackgroundModule
    syncSettings: SyncSettingsBackground
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
    contentConversations: ContentConversationsBackground
    tabManagement: TabManagementBackground
    readwise: ReadwiseBackground
    activityStreams: ActivityStreamsBackground
    userMessages: UserMessageService
    personalCloud: PersonalCloudBackground
}

const globalFetch: typeof fetch =
    typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null

export function createBackgroundModules(options: {
    storageManager: StorageManager
    persistentStorageManager: StorageManager
    services: Services
    browserAPIs: Browser
    getServerStorage: () => Promise<ServerStorage>
    signalTransportFactory: SignalTransportFactory
    localStorageChangesManager: StorageChangesManager
    callFirebaseFunction: <Returns>(
        name: string,
        ...args: any[]
    ) => Promise<Returns>
    personalCloudBackend?: PersonalCloudBackend
    contentSharingBackend?: ContentSharingBackend
    fetchPageDataProcessor?: FetchPageProcessor
    tabManager?: TabManager
    auth?: AuthBackground
    analyticsManager: Analytics
    captureException?: typeof captureException
    userMessageService?: UserMessageService
    disableSyncEnryption?: boolean
    getIceServers?: () => Promise<string[]>
    getNow?: () => number
    fetch?: typeof fetch
    generateServerId?: (collectionName: string) => number | string
    createRemoteEventEmitter?<ModuleName extends keyof RemoteEvents>(
        name: ModuleName,
        options?: { broadcastToTabs?: boolean },
    ): RemoteEventEmitter<ModuleName>
    userAgentString?: string
}): BackgroundModules {
    const createRemoteEventEmitter =
        options.createRemoteEventEmitter ?? remoteEventEmitter
    const getNow = options.getNow ?? (() => Date.now())
    const fetch = options.fetch ?? globalFetch
    const generateServerId =
        options.generateServerId ??
        ((collectionName) =>
            getFirebase().firestore().collection(collectionName).doc().id)

    const { storageManager } = options
    const getServerStorage = async () =>
        (await options.getServerStorage()).storageModules
    const getServerStorageManager = async () =>
        (await options.getServerStorage()).storageManager

    const syncSettings = new SyncSettingsBackground({
        storageManager,
        localBrowserStorage: options.browserAPIs.storage.local,
    })

    const syncSettingsStore = createSyncSettingsStore({
        syncSettingsBG: syncSettings,
    })

    const tabManager = options.tabManager || new TabManager()
    const tabManagement = new TabManagementBackground({
        tabManager,
        browserAPIs: options.browserAPIs,
        extractRawPageContent: (tabId) =>
            runInTab<PageAnalyzerInterface>(tabId).extractRawPageContent(),
    })
    const callFirebaseFunction = <Returns>(name: string, ...args: any[]) => {
        const call = options.callFirebaseFunction
        if (!call) {
            throw new Error(
                `Tried to call Firebase Function '${name}', but did not provide a function to call it`,
            )
        }
        return call<Returns>(name, ...args)
    }

    const analytics = new AnalyticsBackground(options.analyticsManager, {
        localBrowserStorage: options.browserAPIs.storage.local,
    })

    const pages = new PageIndexingBackground({
        storageManager,
        persistentStorageManager: options.persistentStorageManager,
        fetchPageData: options.fetchPageDataProcessor,
        createInboxEntry,
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
        searchBackgroundModule: search,
        analytics,
        localBrowserStorage: options.browserAPIs.storage.local,
    })

    const reader = new ReaderBackground({ storageManager })

    const pdfBg = new PDFBackground({
        webRequestAPI: options.browserAPIs.webRequest,
        runtimeAPI: options.browserAPIs.runtime,
        tabsAPI: options.browserAPIs.tabs,
        syncSettings: syncSettingsStore,
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

    const activityIndicator = new ActivityIndicatorBackground({
        services: options.services,
        getActivityStreamsStorage: async () =>
            (await options.getServerStorage()).storageModules.activityStreams,
    })

    const directLinking = new DirectLinkingBackground({
        browserAPIs: options.browserAPIs,
        storageManager,
        socialBg: social,
        pages,
        analytics,
        getServerStorage,
        preAnnotationDelete: async (params) => {
            await contentSharing.deleteAnnotationShare(params)
        },
    })

    const customLists = new CustomListBackground({
        analytics,
        storageManager,
        tabManagement,
        queryTabs: bindMethod(options.browserAPIs.tabs, 'query'),
        windows: options.browserAPIs.windows,
        searchIndex: search.searchIndex,
        pages,
        localBrowserStorage: options.browserAPIs.storage.local,
        getServerStorage,
        services: options.services,
        removeChildAnnotationsFromList: directLinking.removeChildAnnotationsFromList.bind(
            directLinking,
        ),
    })

    const auth =
        options.auth ||
        new AuthBackground({
            authService: options.services.auth,
            remoteEmitter: createRemoteEventEmitter('auth'),
            subscriptionService: options.services.subscriptions,
            localStorageArea: options.browserAPIs.storage.local,
            scheduleJob: jobScheduler.scheduler.scheduleJobOnce.bind(
                jobScheduler.scheduler,
            ),
            backendFunctions: {
                registerBetaUser: async (params) =>
                    callFirebaseFunction('registerBetaUser', params),
            },
            getUserManagement: async () =>
                (await options.getServerStorage()).storageModules
                    .userManagement,
        })

    const activityStreams = new ActivityStreamsBackground({
        storageManager,
        callFirebaseFunction,
    })

    if (!options.userMessageService) {
        const userMessagesService = new FirebaseUserMessageService({
            firebase: getFirebase,
            auth: {
                getCurrentUserId: async () =>
                    (await auth.authService.getCurrentUser())?.id,
            },
        })
        options.userMessageService = userMessagesService
        userMessagesService.startListening({
            auth: { events: auth.authService.events },
            lastSeen: {
                get: async () =>
                    (
                        await options.browserAPIs.storage.local.get(
                            'userMessages.lastSeen',
                        )
                    ).lastUserMessageSeen,
                set: async (value) => {
                    await options.browserAPIs.storage.local.set({
                        'userMessages.lastSeen': value,
                    })
                },
            },
        })
    }
    const userMessages = options.userMessageService

    const contentSharing = new ContentSharingBackground({
        backend:
            options.contentSharingBackend ??
            firebaseService<ContentSharingBackend>(
                'personalCloud',
                callFirebaseFunction,
            ),
        remoteEmitter: createRemoteEventEmitter('contentSharing', {
            broadcastToTabs: true,
        }),
        activityStreams,
        storageManager,
        customListsBG: customLists,
        annotations: directLinking.annotationStorage,
        auth,
        analytics: options.analyticsManager,
        getServerStorage,
        services: options.services,
        captureException: options.captureException,
        generateServerId,
    })

    const readwiseSettingsStore = new BrowserSettingsStore<ReadwiseSettings>(
        syncSettings,
        { prefix: 'readwise.' },
    )

    const readwise = new ReadwiseBackground({
        fetch,
        storageManager,
        customListsBG: customLists,
        annotationsBG: directLinking,
        settingsStore: readwiseSettingsStore,
        getPageData: async (normalizedUrl) =>
            pick(
                await pages.storage.getPage(normalizedUrl),
                'url',
                'fullUrl',
                'fullTitle',
            ),
    })

    const copyPaster = new CopyPasterBackground({
        storageManager,
        contentSharing,
        search,
    })

    const localExtSettingStore = new BrowserSettingsStore<
        LocalExtensionSettings
    >(options.browserAPIs.storage.local, {
        prefix: 'localSettings.',
    })

    const connectivityChecker = new ConnectivityCheckerBackground({
        xhr: new XMLHttpRequest(),
    })

    const storePageContent = async (content: PipelineRes): Promise<void> => {
        await pages.createOrUpdatePage(content)
    }
    const pageFetchBacklog = new PageFetchBacklogBackground({
        storageManager,
        connectivityChecker,
        fetchPageData: options.fetchPageDataProcessor,
        storePageContent,
    })

    async function createInboxEntry(fullPageUrl: string) {
        await customLists.createInboxListEntry({ fullUrl: fullPageUrl })
    }

    const postReceiveProcessor =
        options.fetchPageDataProcessor != null
            ? new PostReceiveProcessor({
                  pages,
                  pageFetchBacklog,
                  fetchPageData: options.fetchPageDataProcessor,
              }).processor
            : undefined

    const personalCloudSettingStore = new BrowserSettingsStore<
        LocalPersonalCloudSettings
    >(options.browserAPIs.storage.local, {
        prefix: 'personalCloud.',
    })
    const personalCloud: PersonalCloudBackground = new PersonalCloudBackground({
        storageManager,
        syncSettingsStore,
        persistentStorageManager: options.persistentStorageManager,
        backend:
            options.personalCloudBackend ??
            new FirestorePersonalCloudBackend({
                getFirebase,
                getServerStorageManager,
                personalCloudService: firebaseService<PersonalCloudService>(
                    'personalCloud',
                    callFirebaseFunction,
                ),
                getCurrentSchemaVersion: () =>
                    getCurrentSchemaVersion(options.storageManager),
                userChanges: () => authChanges(auth.authService),
                getUserChangesReference: async () => {
                    const currentUser = await auth.authService.getCurrentUser()
                    if (!currentUser) {
                        return null
                    }
                    const firebase = getFirebase()
                    const firestore = firebase.firestore()
                    return firestore
                        .collection('personalDataChange')
                        .doc(currentUser.id)
                        .collection('objects')
                },
                getLastUpdateProcessedTime: () =>
                    personalCloudSettingStore.get('lastSeen'),
                getDeviceId: async () => personalCloud.deviceId!,
                getClientDeviceType: () => PersonalDeviceType.DesktopBrowser,
            }),
        remoteEventEmitter: createRemoteEventEmitter('personalCloud'),
        createDeviceId: async (userId) => {
            const uaParser = new UAParser(options.userAgentString)
            const serverStorage = await options.getServerStorage()
            const device = await serverStorage.storageModules.personalCloud.createDeviceInfo(
                {
                    device: {
                        type: PersonalDeviceType.DesktopBrowser,
                        os: kebabCase(uaParser.getOS().name),
                        browser: kebabCase(uaParser.getBrowser().name),
                        product: PersonalDeviceProduct.Extension,
                    },
                    userId,
                },
            )
            return device.id
        },
        settingStore: personalCloudSettingStore,
        localExtSettingStore,
        getUserId: async () =>
            (await auth.authService.getCurrentUser())?.id ?? null,
        async *userIdChanges() {
            for await (const nextUser of authChanges(auth.authService)) {
                yield nextUser
            }
        },
        writeIncomingData: async (params) => {
            const incomingStorageManager =
                params.storageType === PersonalCloudClientStorageType.Persistent
                    ? options.persistentStorageManager
                    : options.storageManager

            // Add any newly created lists to the list suggestion cache
            if (
                params.collection === 'customLists' &&
                params.updates.id != null
            ) {
                const existingList = await options.storageManager.backend.operation(
                    'findObject',
                    params.collection,
                    { id: params.updates.id },
                )

                if (existingList == null) {
                    await customLists.updateListSuggestionsCache({
                        added: params.updates.id,
                    })
                }
            }

            // WARNING: Keep in mind this skips all storage middleware
            await updateOrCreate({
                ...params,
                storageManager: incomingStorageManager,
                executeOperation: (...args: any[]) => {
                    return (incomingStorageManager.backend.operation as any)(
                        ...args,
                    )
                },
            })

            if (params.collection === 'docContent') {
                const { normalizedUrl, storedContentType } = params.where ?? {}
                const { content } = params.updates
                if (!normalizedUrl || !content) {
                    console.warn(
                        `Got an incoming page, but it didn't include a URL and a body`,
                    )
                    return
                }

                const processed =
                    storedContentType === StoredContentType.HtmlBody
                        ? transformPageHTML({
                              html: content,
                          }).text
                        : transformPageText({
                              text: (content.pageTexts ?? []).join(' '),
                          }).text
                await storageManager.backend.operation(
                    'updateObjects',
                    'pages',
                    {
                        url: normalizedUrl,
                    },
                    { text: processed },
                )
            }
        },
        getServerStorageManager,
    })

    const bgScript = new BackgroundScript({
        storageChangesMan: options.localStorageChangesManager,
        urlNormalizer: normalizeUrl,
        commandsAPI: browser.commands,
        runtimeAPI: browser.runtime,
        storageAPI: browser.storage,
        alarmsAPI: browser.alarms,
        tabsAPI: browser.tabs,
        localExtSettingStore,
        syncSettingsStore,
        storageManager,
        bgModules: {
            readwise,
            copyPaster,
            customLists,
            syncSettings,
            tabManagement,
            personalCloud,
            notifications,
        },
    })

    options.services.contentSharing.preKeyGeneration = async (params) => {
        if (params.key.roleID > SharedListRoleID.Commenter) {
            await personalCloud.waitForSync()
        }
    }

    return {
        auth,
        social,
        analytics,
        jobScheduler,
        notifications,
        connectivityChecker,
        readable: reader,
        pdfBg,
        directLinking,
        search,
        eventLog: new EventLogBackground({ storageManager }),
        activityIndicator,
        customLists,
        tags,
        bookmarks,
        tabManagement,
        readwise,
        syncSettings,
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
            getSharedSyncLog: async () =>
                (await options.getServerStorage()).storageModules.sharedSyncLog,
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
            browserAPIs: options.browserAPIs,
        }),
        inPageUI: new InPageUIBackground({
            queryTabs: bindMethod(options.browserAPIs.tabs, 'query'),
            contextMenuAPI: options.browserAPIs.contextMenus,
        }),
        copyPaster,
        activityStreams,
        userMessages,
        personalCloud,
        contentSharing,
        contentConversations: new ContentConversationsBackground({
            getServerStorage,
            services: options.services,
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
    backgroundModules.activityIndicator.setupRemoteFunctions()
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
    backgroundModules.contentConversations.setupRemoteFunctions()
    backgroundModules.pages.setupRemoteFunctions()
    backgroundModules.syncSettings.setupRemoteFunctions()
    setupNotificationClickListener()
    setupBlacklistRemoteFunctions()
    backgroundModules.backupModule.storage.setupChangeTracking()

    await backgroundModules.pdfBg.setupRequestInterceptors()
    await backgroundModules.analytics.setup()
    await backgroundModules.jobScheduler.setup()
    backgroundModules.sync.registerRemoteEmitter()

    // Ensure log-in state gotten from FB + trigger share queue processing, but don't wait for it
    await backgroundModules.auth.authService.refreshUserInfo()
    await backgroundModules.contentSharing.setup()
    await backgroundModules.personalCloud.setup()
}

export function getBackgroundStorageModules(
    backgroundModules: BackgroundModules,
): { [moduleName: string]: StorageModule } {
    return {
        pageFetchBacklog: backgroundModules.pageFetchBacklog.storage,
        annotations: backgroundModules.directLinking.annotationStorage,
        readwiseAction:
            backgroundModules.readwise.__deprecatedActionQueue.storage,
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
        syncSettings: backgroundModules.syncSettings.storage,
        personalCloudActionQueue:
            backgroundModules.personalCloud.actionQueue.storage,
    }
}

export function getPersistentBackgroundStorageModules(
    backgroundModules: BackgroundModules,
): { [moduleName: string]: StorageModule } {
    return {
        pages: backgroundModules.pages.persistentStorage,
    }
}

export function registerBackgroundModuleCollections(options: {
    storageManager: StorageManager
    persistentStorageManager: StorageManager
    backgroundModules: BackgroundModules
}) {
    registerModuleMapCollections(
        options.storageManager.registry,
        getBackgroundStorageModules(options.backgroundModules),
    )
    registerModuleMapCollections(
        options.persistentStorageManager.registry,
        getPersistentBackgroundStorageModules(options.backgroundModules),
    )
}
