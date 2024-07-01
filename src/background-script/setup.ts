import kebabCase from 'lodash/kebabCase'
import type { Browser } from 'webextension-polyfill'
import { UAParser } from 'ua-parser-js'
import StorageManager from '@worldbrain/storex'
import NotificationBackground from 'src/notifications/background'
import SocialBackground from 'src/social-integration/background'
import DirectLinkingBackground from 'src/annotations/background'
import SearchBackground from 'src/search/background'
import EventLogBackground from 'src/analytics/internal/background'
import CustomListBackground from 'src/custom-lists/background'
import TagsBackground from 'src/tags/background'
import BookmarksBackground from 'src/bookmarks/background'
import * as backup from '../backup-restore/background'
import { PKMSyncBackgroundModule } from '../pkm-integrations/background'
import { getAuth } from 'firebase/auth/web-extension'
import {
    getStorage,
    ref,
    uploadString,
    uploadBytes,
    getDownloadURL,
} from 'firebase/storage'
import {
    registerModuleMapCollections,
    StorageModule,
} from '@worldbrain/storex-pattern-modules'
import { firebaseService } from '@worldbrain/memex-common/lib/firebase-backend/services/client'
import {
    setImportStateManager,
    ImportStateManager,
} from 'src/imports/background/state-manager'
import { setupImportBackgroundModule } from 'src/imports/background'
import BackgroundScript from '.'
import { setupNotificationClickListener } from 'src/util/notifications'
import { StorageChangesManager } from 'src/util/storage-changes'
import { AuthBackground } from 'src/authentication/background'
import { FeaturesBeta } from 'src/features/background/feature-beta'
import { PageIndexingBackground } from 'src/page-indexing/background'
import { StorexHubBackground } from 'src/storex-hub/background'
import { bindMethod } from 'src/util/functions'
import { ContentScriptsBackground } from 'src/content-scripts/background'
import { InPageUIBackground } from 'src/in-page-ui/background'
import { AnalyticsBackground } from 'src/analytics/background'
import { Analytics } from 'src/analytics/types'
import type { ExtractedPDFData, PipelineRes } from 'src/search'
import CopyPasterBackground from 'src/copy-paster/background'
import { ReaderBackground } from 'src/reader/background'
import { ServerStorage } from 'src/storage/types'
import ContentSharingBackground from 'src/content-sharing/background'
import ContentConversationsBackground from 'src/content-conversations/background'
import { getFirebase } from 'src/util/firebase-app-initialized'
import TabManagementBackground from 'src/tab-management/background'
import {
    RemoteEventEmitter,
    RemoteEvents,
    remoteEventEmitter,
} from 'src/util/webextensionRPC'
import { ReadwiseBackground } from 'src/readwise-integration/background'
import pick from 'lodash/pick'
import ActivityIndicatorBackground from 'src/activity-indicator/background'
import SummarizeBackground from 'src/summarization-llm/background'
import ActivityStreamsBackground from 'src/activity-streams/background'
import { SyncSettingsBackground } from 'src/sync-settings/background'
import type { AuthServices, Services } from 'src/services/types'
import { captureException } from 'src/util/raven'
import { PDFBackground } from 'src/pdf/background'
// import { FirebaseUserMessageService } from '@worldbrain/memex-common/lib/user-messages/service/firebase'
// import { UserMessageService } from '@worldbrain/memex-common/lib/user-messages/service/types'
import {
    PersonalDeviceType,
    PersonalDeviceProduct,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import { PersonalCloudBackground } from 'src/personal-cloud/background'
import {
    PersonalCloudBackend,
    PersonalCloudMediaBackend,
    PersonalCloudService,
    SyncTriggerSetup,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/types'
import { BrowserSettingsStore } from 'src/util/settings'
import type { LocalPersonalCloudSettings } from 'src/personal-cloud/background/types'
import { authChangesGeneratorFactory } from '@worldbrain/memex-common/lib/authentication/utils'
import FirebasePersonalCloudBackend, {
    CloudBackendFirebaseDeps,
    FirebasePersonalCloudMediaBackend,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/firebase'
import { deviceIdCreatorFactory } from '@worldbrain/memex-common/lib/personal-cloud/storage/device-id'
import { getCurrentSchemaVersion } from '@worldbrain/memex-common/lib/storage/utils'
import { ContentSharingBackend } from '@worldbrain/memex-common/lib/content-sharing/backend'
import type { ReadwiseSettings } from 'src/readwise-integration/background/types/settings'
import type { LocalExtensionSettings } from './types'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { createSyncSettingsStore } from 'src/sync-settings/util'
import DeprecatedStorageModules from './deprecated-storage-modules'
import { PageActivityIndicatorBackground } from 'src/page-activity-indicator/background'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import { handleIncomingData } from 'src/personal-cloud/background/handle-incoming-data'
import type { PageDataResult } from '@worldbrain/memex-common/lib/page-indexing/fetch-page-data/types'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import { ImageSupportBackground } from 'src/image-support/background'
import { ImageSupportBackend } from '@worldbrain/memex-common/lib/image-support/types'
import { PdfUploadService } from '@worldbrain/memex-common/lib/pdf/uploads/service'
import { dataUrlToBlob } from '@worldbrain/memex-common/lib/utils/blob-to-data-url'
import { FOLLOWED_LIST_SYNC_ALARM_NAME } from 'src/page-activity-indicator/constants'
import {
    CLOUD_SYNC_PERIODIC_DL_ALARM_NAME,
    CLOUD_SYNC_RETRY_UL_ALARM_NAME,
} from 'src/personal-cloud/background/constants'
import checkBrowser from 'src/util/check-browser'
import { AUTOMATED_BACKUP_ALARM_NAME } from 'src/backup-restore/background/constants'
import { AlarmJob, setupAlarms } from './alarms'
import {
    DB_DATA_LOSS_CHECK_ALARM_NAME,
    checkDataLoss,
} from './db-data-loss-check'
import {
    CHECK_MEMEX_UPDATE_ALARM_NAME,
    checkForUpdates,
} from './memex-update-check'

export interface BackgroundModules {
    analyticsBG: AnalyticsCoreInterface
    auth: AuthBackground
    analytics: AnalyticsBackground
    notifications: NotificationBackground
    social: SocialBackground
    pdfBg: PDFBackground
    // connectivityChecker: ConnectivityCheckerBackground
    pageActivityIndicator: PageActivityIndicatorBackground
    activityIndicator: ActivityIndicatorBackground
    summarizeBG: SummarizeBackground
    directLinking: DirectLinkingBackground
    pages: PageIndexingBackground
    search: SearchBackground
    eventLog: EventLogBackground
    customLists: CustomListBackground
    tags: TagsBackground
    bookmarks: BookmarksBackground
    backupModule: backup.BackupBackgroundModule
    pkmSyncModule: PKMSyncBackgroundModule
    syncSettings: SyncSettingsBackground
    bgScript: BackgroundScript
    contentScripts: ContentScriptsBackground
    inPageUI: InPageUIBackground
    // features: FeatureOptIns
    featuresBeta: FeaturesBeta
    storexHub: StorexHubBackground
    copyPaster: CopyPasterBackground
    readable: ReaderBackground
    contentSharing: ContentSharingBackground
    contentConversations: ContentConversationsBackground
    tabManagement: TabManagementBackground
    readwise: ReadwiseBackground
    activityStreams: ActivityStreamsBackground
    // userMessages: UserMessageService
    personalCloud: PersonalCloudBackground
    imageSupport: ImageSupportBackground
    pkmSyncBG: PKMSyncBackgroundModule
}

export function createBackgroundModules(options: {
    manifestVersion: '2' | '3'
    storageManager: StorageManager
    persistentStorageManager: StorageManager
    authServices: AuthServices
    services: Services
    browserAPIs: Browser
    serverStorage: ServerStorage
    imageSupportBackend: ImageSupportBackend
    backendEnv: 'staging' | 'production'
    localStorageChangesManager: StorageChangesManager
    callFirebaseFunction: <Returns>(
        name: string,
        ...args: any[]
    ) => Promise<Returns>
    personalCloudBackend?: PersonalCloudBackend
    personalCloudMediaBackend?: PersonalCloudMediaBackend
    contentSharingBackend?: ContentSharingBackend
    fetchPageData: (fullPageUrl: string) => Promise<PageDataResult>
    fetchPDFData: (fullPageUrl: string) => Promise<ExtractedPDFData>
    auth?: AuthBackground
    analyticsManager: Analytics
    captureException: typeof captureException
    // userMessageService?: UserMessageService
    getNow?: () => number
    fetch: typeof fetch
    generateServerId?: (collectionName: string) => number | string
    createRemoteEventEmitter?<ModuleName extends keyof RemoteEvents>(
        name: ModuleName,
        options?: {
            broadcastToTabs?: boolean
            silenceBroadcastFailures?: boolean
        },
    ): RemoteEventEmitter<ModuleName>
    getFCMRegistrationToken?: () => Promise<string>
    // NOTE: Currently only used in MV2 builds, allowing us to trigger sync on Firestore changes
    setupSyncTriggerListener?: SyncTriggerSetup
    userAgentString?: string
}): BackgroundModules {
    const createRemoteEventEmitter =
        options.createRemoteEventEmitter ?? remoteEventEmitter
    const getNow = options.getNow ?? (() => Date.now())
    const fetch = options.fetch
    const generateServerId =
        options.generateServerId ??
        ((collectionName) =>
            getFirebase().firestore().collection(collectionName).doc().id)

    const { storageManager } = options

    const syncSettings = new SyncSettingsBackground({
        storageManager,
        localBrowserStorage: options.browserAPIs.storage.local,
    })

    const syncSettingsStore = createSyncSettingsStore({
        syncSettingsBG: syncSettings,
    })

    const tabManagement = new TabManagementBackground({
        browserAPIs: options.browserAPIs,
        manifestVersion: options.manifestVersion,
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
        sendBqEvent: (event) =>
            callFirebaseFunction('analytics-trackEvent', event),
    })

    const analyticsBG = analytics

    const notifications = new NotificationBackground({ storageManager })

    const auth =
        options.auth ||
        new AuthBackground({
            runtimeAPI: options.browserAPIs.runtime,
            authServices: options.authServices,
            remoteEmitter: createRemoteEventEmitter('auth'),
            localStorageArea: options.browserAPIs.storage.local,
            getFCMRegistrationToken: options.getFCMRegistrationToken,
            backendFunctions: {
                registerBetaUser: async (params) =>
                    callFirebaseFunction('registerBetaUser', params),
            },
            userManagement: options.serverStorage.modules.users,
        })

    const getCurrentUserId = async (): Promise<AutoPk | null> =>
        (await auth.authService.getCurrentUser())?.id ?? null

    const pkmSyncBG = new PKMSyncBackgroundModule({
        browserAPIs: options.browserAPIs,
    })

    const pages = new PageIndexingBackground({
        persistentStorageManager: options.persistentStorageManager,
        pageIndexingSettingsStore: new BrowserSettingsStore(
            options.browserAPIs.storage.local,
            { prefix: 'pageIndexing.' },
        ),
        fetchPageData: options.fetchPageData,
        fetchPdfData: options.fetchPDFData,
        browserAPIs: options.browserAPIs,
        createInboxEntry,
        storageManager,
        tabManagement,
        getNow,
        authBG: auth,
        pkmSyncBG,
        fetch,
    })
    tabManagement.events.on('tabRemoved', async (event) => {
        await pages.handleTabClose(event)
    })
    const bookmarks = new BookmarksBackground({
        storageManager,
        pages,
        analytics,
        analyticsBG,
        browserAPIs: options.browserAPIs,
        manifestVersion: options.manifestVersion,
    })

    const search = new SearchBackground({
        pages,
        analyticsBG,
        storageManager,
        captureException: options.captureException,
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

    const pdfUploads = new PdfUploadService({
        callFirebaseFunction,
        dataUrlToBlob,
        env: options.backendEnv,
    })
    const pdfBg = new PDFBackground({
        manifestVersion: options.manifestVersion,
        runtimeAPI: options.browserAPIs.runtime,
        storageAPI: options.browserAPIs.storage,
        tabsAPI: options.browserAPIs.tabs,
        syncSettings: syncSettingsStore,
        generateUploadId: () => generateServerId('uploadAuditLogEntry'),
        pageStorage: pages.storage,
        pdfUploads,
        getNow,
        fetch,
    })
    pages.options.onPagePut = pdfBg.handlePagePut

    const social = new SocialBackground({ storageManager })

    const activityIndicator = new ActivityIndicatorBackground({
        services: options.services,
        syncSettings: syncSettingsStore,
        authServices: options.authServices,
        activityStreamsStorage: options.serverStorage.modules.activityStreams,
    })

    const imageSupport = new ImageSupportBackground({
        backend: options.imageSupportBackend,
        storageManager: options.storageManager,
        generateImageId: () => generateServerId('UPLOADED_IMAGES') as string,
    })

    const directLinking = new DirectLinkingBackground({
        browserAPIs: options.browserAPIs,
        storageManager,
        socialBg: social,
        pages,
        analytics,
        analyticsBG,
        pkmSyncBG,
        authBG: auth,
        serverStorage: options.serverStorage.modules,
        preAnnotationDelete: async (params) => {
            await contentSharing.deleteAnnotationShare(params)
        },
    })

    const activityStreams = new ActivityStreamsBackground({
        storageManager,
        callFirebaseFunction,
    })

    // NOTE: Commented this stuff out as it brought in a dep on FB Realtime Database, which we didn't
    //  seem to be using anywhere, apart from setting the local storage lastSeen key here (which is unused).
    //  Realtime DB seemed to try and ping FB very often to get the data, which started causing lots of errors in MV3
    //  due to the stricter CSP.
    // if (!options.userMessageService) {
    //     const userMessagesService = new FirebaseUserMessageService({
    //         firebase: getFirebase,
    //         auth: { getCurrentUserId },
    //     })
    //     options.userMessageService = userMessagesService
    //     userMessagesService.startListening({
    //         auth: { events: auth.authService.events },
    //         lastSeen: {
    //             get: async () =>
    //                 (
    //                     await options.browserAPIs.storage.local.get(
    //                         'userMessages.lastSeen',
    //                     )
    //                 ).lastUserMessageSeen,
    //             set: async (value) => {
    //                 await options.browserAPIs.storage.local.set({
    //                     'userMessages.lastSeen': value,
    //                 })
    //             },
    //         },
    //     })
    // }
    // const userMessages = options.userMessageService
    const contentSharingBackend =
        options.contentSharingBackend ??
        firebaseService<ContentSharingBackend>(
            'contentSharing',
            callFirebaseFunction,
        )

    const contentSharing: ContentSharingBackground = new ContentSharingBackground(
        {
            backend: contentSharingBackend,
            remoteEmitter: createRemoteEventEmitter('contentSharing', {
                broadcastToTabs: true,
            }),
            analyticsBG,
            waitForSync: () => personalCloud.waitForSync(),
            storageManager,
            contentSharingSettingsStore: new BrowserSettingsStore(
                options.browserAPIs.storage.local,
                { prefix: 'contentSharing.' },
            ),
            analytics: options.analyticsManager,
            services: options.services,
            captureException: options.captureException,
            serverStorage: options.serverStorage.modules,
            generateServerId,
            getBgModules: () => ({
                auth,
                pages,
                customLists,
                directLinking,
                pageActivityIndicator,
            }),
        },
    )

    const customLists = new CustomListBackground({
        analytics,
        storageManager,
        tabManagement,
        contentSharing,
        contentSharingBackend,
        browserAPIs: options.browserAPIs,
        pages,
        authServices: options.authServices,
        removeChildAnnotationsFromList: directLinking.removeChildAnnotationsFromList.bind(
            directLinking,
        ),
        analyticsBG,
        pkmSyncBG,
    })
    pages.options.collectionsBG = customLists
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

    const localExtSettingStore = new BrowserSettingsStore<
        LocalExtensionSettings
    >(options.browserAPIs.storage.local, {
        prefix: 'localSettings.',
    })

    // const connectivityChecker = new ConnectivityCheckerBackground({
    //     xhr: new XMLHttpRequest(),
    //     jobScheduler: jobScheduler.scheduler,
    // })

    const storePageContent = async (content: PipelineRes): Promise<void> => {
        await pages.createOrUpdatePage(content)
    }

    async function createInboxEntry(fullPageUrl: string) {
        await customLists.createInboxListEntry({ fullUrl: fullPageUrl })
    }

    const personalCloudSettingStore = new BrowserSettingsStore<
        LocalPersonalCloudSettings
    >(options.browserAPIs.storage.local, {
        prefix: 'personalCloud.',
    })

    const pageActivityIndicator = new PageActivityIndicatorBackground({
        fetch,
        storageManager,
        getCurrentUserId,
        contentSharingBackend,
        pkmSyncBG,
    })
    const summarizeBG = new SummarizeBackground({
        remoteEventEmitter: createRemoteEventEmitter('pageSummary'),
        browserAPIs: options.browserAPIs,
        analyticsBG,
    })

    const uaParser = new UAParser(options.userAgentString)
    const createDeviceId = deviceIdCreatorFactory({
        serverStorage: options.serverStorage.modules,
        personalDeviceInfo: {
            type: PersonalDeviceType.DesktopBrowser,
            product: PersonalDeviceProduct.Extension,
            browser: kebabCase(uaParser.getBrowser().name),
            os: kebabCase(uaParser.getOS().name),
        },
    })

    const authChangesGenerator = authChangesGeneratorFactory({
        createDeviceId,
        authService: auth.authService,
        getDeviceId: () => personalCloudSettingStore.get('deviceId'),
        setDeviceId: (deviceId) =>
            personalCloudSettingStore.set('deviceId', deviceId),
    })

    const firebase: CloudBackendFirebaseDeps = {
        ref,
        getAuth,
        getStorage,
        uploadBytes,
        uploadString,
        getDownloadURL,
    }

    const personalCloud: PersonalCloudBackground = new PersonalCloudBackground({
        storageManager,
        syncSettingsStore,
        serverStorageManager: options.serverStorage.manager,
        webExtAPIs: options.browserAPIs,
        persistentStorageManager: options.persistentStorageManager,
        mediaBackend:
            options.personalCloudMediaBackend ??
            new FirebasePersonalCloudMediaBackend({
                firebase,
                serverStorageManager: options.serverStorage.manager,
            }),
        backend:
            options.personalCloudBackend ??
            new FirebasePersonalCloudBackend({
                firebase,
                serverStorageManager: options.serverStorage.manager,
                personalCloudService: firebaseService<PersonalCloudService>(
                    'personalCloud',
                    callFirebaseFunction,
                ),
                getCurrentSchemaVersion: () =>
                    getCurrentSchemaVersion(options.storageManager),
                authChanges: authChangesGenerator,
                getLastUpdateProcessedTime: () =>
                    personalCloudSettingStore.get('lastSeen'),
                // NOTE: this is for retrospective collection sync, which is currently unused in the extension
                getLastCollectionDataProcessedTime: async () => 0,
                getDeviceId: async () => personalCloud.deviceId!,
                getClientDeviceType: () => PersonalDeviceType.DesktopBrowser,
                setupSyncTriggerListener: options.setupSyncTriggerListener,
            }),
        remoteEventEmitter: createRemoteEventEmitter('personalCloud'),
        settingStore: personalCloudSettingStore,
        localExtSettingStore,
        getUserId: getCurrentUserId,
        authChanges: authChangesGenerator,
        writeIncomingData: handleIncomingData({
            customListsBG: customLists,
            pageActivityIndicatorBG: pageActivityIndicator,
            persistentStorageManager: options.persistentStorageManager,
            storageManager: options.storageManager,
            browserAPIs: options.browserAPIs,
            pkmSyncBG,
            imageSupportBG: imageSupport,
        }),
    })

    const copyPaster = new CopyPasterBackground({
        storageManager,
        contentSharing,
        search,
    })

    const bgScript = new BackgroundScript({
        storageChangesMan: options.localStorageChangesManager,
        urlNormalizer: normalizeUrl,
        runtimeAPI: options.browserAPIs.runtime,
        browserAPIs: options.browserAPIs,
        storageAPI: options.browserAPIs.storage,
        tabsAPI: options.browserAPIs.tabs,
        captureException: options.captureException,
        localExtSettingStore,
        syncSettingsStore,
        storageManager,
        analyticsBG,
        bgModules: {
            readwise,
            copyPaster,
            customLists,
            syncSettings,
            tabManagement,
            personalCloud,
            notifications,
            pageActivityIndicator,
            summarizeBG,
            auth,
            contentSharing,
            pkmSyncBG,
        },
    })

    return {
        auth,
        social,
        analytics,
        analyticsBG,
        notifications,
        // connectivityChecker,
        readable: reader,
        pdfBg,
        pkmSyncBG,
        directLinking,
        search,
        eventLog: new EventLogBackground({ storageManager }),
        activityIndicator,
        pageActivityIndicator,
        summarizeBG,
        customLists,
        tags,
        bookmarks,
        tabManagement,
        readwise,
        syncSettings,
        backupModule: new backup.BackupBackgroundModule({
            storageManager,
            browserAPIs: options.browserAPIs,
            localBackupSettings: new BrowserSettingsStore(
                options.browserAPIs.storage.local,
                { prefix: 'localBackup.' },
            ),
            notifications,
            checkAuthorizedForAutoBackup: async () =>
                auth.remoteFunctions.isAuthorizedForFeature('backup'),
        }),
        pkmSyncModule: pkmSyncBG,
        storexHub: new StorexHubBackground({
            storageManager,
            localBrowserStorage: options.browserAPIs.storage.local,
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
        // features: new FeatureOptIns(),
        featuresBeta: new FeaturesBeta(),
        pages,
        bgScript,
        contentScripts: new ContentScriptsBackground({
            contentSharingStorage: contentSharing.storage,
            browserAPIs: options.browserAPIs,
            waitForSync: () => personalCloud.waitForSync(),
            injectScriptInTab: async (tabId, file) => {
                if (options.manifestVersion === '3') {
                    await options.browserAPIs.scripting.executeScript({
                        target: { tabId },
                        files: [file],
                    })
                } else {
                    await options.browserAPIs.tabs.executeScript(tabId, {
                        file,
                    })
                }
            },
        }),
        inPageUI: new InPageUIBackground({
            tabsAPI: options.browserAPIs.tabs,
            contextMenuAPI: options.browserAPIs.contextMenus,
            browserAPIs: options.browserAPIs,
            fetch: options.fetch,
        }),
        copyPaster,
        activityStreams,
        // userMessages,
        personalCloud,
        contentSharing,
        contentConversations: new ContentConversationsBackground({
            serverStorage: options.serverStorage.modules,
            services: options.services,
        }),
        imageSupport,
    }
}

export async function setupBackgroundModules(
    backgroundModules: BackgroundModules,
    storageManager: StorageManager,
    browserAPIs: Browser,
) {
    backgroundModules.bgScript.setupWebExtAPIHandlers()

    setImportStateManager(
        new ImportStateManager({
            storageManager,
            browserAPIs,
        }),
    )
    setupImportBackgroundModule({
        pages: backgroundModules.pages,
        tagsModule: backgroundModules.tags,
        customListsModule: backgroundModules.customLists,
        bookmarks: backgroundModules.bookmarks,
        runtimeAPI: browserAPIs.runtime,
        storageAPI: browserAPIs.storage,
    })

    backgroundModules.auth.registerRemoteEmitter()
    backgroundModules.notifications.setupRemoteFunctions()
    backgroundModules.social.setupRemoteFunctions()
    backgroundModules.directLinking.setupRemoteFunctions()
    backgroundModules.contentSharing.setupRemoteFunctions()
    backgroundModules.search.setupRemoteFunctions()
    backgroundModules.activityIndicator.setupRemoteFunctions()
    backgroundModules.summarizeBG.setupRemoteFunctions()
    backgroundModules.eventLog.setupRemoteFunctions()
    backgroundModules.backupModule.setBackendFromStorage()
    backgroundModules.backupModule.setupRemoteFunctions()
    backgroundModules.pkmSyncModule.setupRemoteFunctions()
    backgroundModules.backupModule.startRecordingChangesIfNeeded()
    backgroundModules.bgScript.setupRemoteFunctions()
    backgroundModules.contentScripts.setupRemoteFunctions()
    backgroundModules.inPageUI.setupRemoteFunctions()
    backgroundModules.bookmarks.setupBookmarkListeners()
    backgroundModules.tabManagement.setupRemoteFunctions()
    backgroundModules.readwise.setupRemoteFunctions()
    backgroundModules.contentConversations.setupRemoteFunctions()
    backgroundModules.pages.setupRemoteFunctions()
    backgroundModules.syncSettings.setupRemoteFunctions()
    backgroundModules.imageSupport.setupRemoteFunctions()
    setupNotificationClickListener()

    backgroundModules.analytics.setup()

    await backgroundModules.personalCloud.setup()

    // Set up static alarm jobs
    let alarmJobs: { [name: string]: AlarmJob } = {
        [FOLLOWED_LIST_SYNC_ALARM_NAME]: {
            alarmDefinition: { periodInMinutes: 20 },
            job: () =>
                backgroundModules.pageActivityIndicator.syncFollowedListEntriesWithNewActivity(),
        },
        [AUTOMATED_BACKUP_ALARM_NAME]: {
            alarmDefinition: null, // Dynamically scheduled in the backups module
            job: () => backgroundModules.backupModule.doBackup(),
        },
        [CLOUD_SYNC_RETRY_UL_ALARM_NAME]: {
            alarmDefinition: null, // Dynamically scheduled in the personalCloud module
            job: () =>
                backgroundModules.personalCloud.actionQueue.executePendingActions(),
        },
        [DB_DATA_LOSS_CHECK_ALARM_NAME]: {
            alarmDefinition: { periodInMinutes: 15 },
            job: () =>
                checkDataLoss({
                    captureException,
                    db: storageManager.backend['dexie'],
                }),
        },
        [CHECK_MEMEX_UPDATE_ALARM_NAME]: {
            alarmDefinition: { periodInMinutes: 360 },
            job: () => checkForUpdates(),
        },
    }

    if (checkBrowser() !== 'firefox') {
        alarmJobs[CLOUD_SYNC_PERIODIC_DL_ALARM_NAME] = {
            alarmDefinition: { periodInMinutes: 60 },
            job: () => backgroundModules.personalCloud.invokeSyncDownload(),
        }
    }

    setupAlarms(browserAPIs.alarms, alarmJobs)
}

export function getBackgroundStorageModules(
    backgroundModules: BackgroundModules,
    __deprecatedModules: DeprecatedStorageModules,
): { [moduleName: string]: StorageModule } {
    return {
        pageActivityIndicator: backgroundModules.pageActivityIndicator.storage,
        pageFetchBacklog: __deprecatedModules.pageFetchBacklogStorage,
        annotations: backgroundModules.directLinking.annotationStorage,
        readwiseAction: __deprecatedModules.readwiseActionQueueStorage,
        notifications: backgroundModules.notifications.storage,
        customList: backgroundModules.customLists.storage,
        bookmarks: backgroundModules.bookmarks.storage,
        backup: backgroundModules.backupModule.storage,
        eventLog: backgroundModules.eventLog.storage,
        search: backgroundModules.search.storage,
        social: backgroundModules.social.storage,
        tags: backgroundModules.tags.storage,
        clientSyncLog: __deprecatedModules.clientSyncLogStorage,
        syncInfo: __deprecatedModules.syncInfoStorage,
        pages: backgroundModules.pages.storage,
        copyPaster: backgroundModules.copyPaster.storage,
        reader: backgroundModules.readable.storage,
        contentSharing: backgroundModules.contentSharing.storage,
        syncSettings: backgroundModules.syncSettings.storage,
        personalCloudActionQueue:
            backgroundModules.personalCloud.actionQueue.storage,
        imageSupport: backgroundModules.imageSupport.storage,
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
    const deprecatedModules = new DeprecatedStorageModules(options)
    registerModuleMapCollections(
        options.storageManager.registry,
        getBackgroundStorageModules(
            options.backgroundModules,
            deprecatedModules,
        ),
    )
    registerModuleMapCollections(
        options.persistentStorageManager.registry,
        getPersistentBackgroundStorageModules(options.backgroundModules),
    )
}
