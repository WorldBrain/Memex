import { TestLogicContainer } from 'ui-logic-core/lib/testing'

import {
    UILogicTestDevice,
    insertBackgroundFunctionTab,
} from 'src/tests/ui-logic-tests'
import { DashboardLogic } from './logic'
import { Events, RootState } from './types'
import * as DATA from './logic.test.data'
import {
    StandardSearchResponse,
    AnnotationsSearchResponse,
} from 'src/search/background/types'
import { FakeAnalytics } from 'src/analytics/mock'
import { createUIServices } from 'src/services/ui'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import {
    AnnotationSharingState,
    AnnotationSharingStates,
} from 'src/content-sharing/background/types'

type DataSeeder = (
    logic: TestLogicContainer<RootState, Events>,
    device: UILogicTestDevice,
) => Promise<void>
type DataSeederCreator<
    T = StandardSearchResponse | AnnotationsSearchResponse
> = (data?: T) => DataSeeder

export const setPageSearchResult: DataSeederCreator<StandardSearchResponse> = (
    result = DATA.PAGE_SEARCH_RESULT_1,
) => async (logic, { storageManager }) => {
    let idCounter = 0
    for (const page of result.docs) {
        await storageManager.collection('pages').createObject({
            url: page.url,
            title: page.title,
        })
        await storageManager.collection('visits').createObject({
            url: page.url,
            time: Date.now(),
        })

        for (const annot of page.annotations) {
            await storageManager.collection('annotations').createObject({
                ...annot,
            })
            if (annot.isShared) {
                await storageManager
                    .collection('sharedAnnotationMetadata')
                    .createObject({
                        localId: annot.url,
                        remoteId: annot.url,
                        excludeFromLists: false,
                    })
                await storageManager
                    .collection('annotationPrivacyLevels')
                    .createObject({
                        id: idCounter++,
                        annotation: annot.url,
                        createdWhen: new Date(),
                        privacyLevel: annot.isBulkShareProtected
                            ? AnnotationPrivacyLevels.SHARED_PROTECTED
                            : AnnotationPrivacyLevels.SHARED,
                    })
            }
        }

        for (const tag of page.tags) {
            await storageManager.collection('tags').createObject({
                name: tag,
                url: page.url,
            })
        }

        if (page.hasBookmark) {
            await storageManager.collection('bookmarks').createObject({
                url: page.url,
                time: Date.now(),
            })
        }
    }
    await logic.processEvent('setPageSearchResult', { result })
}

export const setNoteSearchResult: DataSeederCreator<AnnotationsSearchResponse> = (
    result = DATA.ANNOT_SEARCH_RESULT_2,
) => async (logic, { storageManager }) => {
    for (const page of result.docs) {
        await storageManager.collection('pages').createObject({
            url: page.url,
            title: page.title,
        })

        for (const annot of page.annotations) {
            await storageManager.collection('annotations').createObject({
                ...annot,
            })
        }

        for (const tag of page.tags) {
            await storageManager.collection('tags').createObject({
                name: tag,
                url: page.url,
            })
        }

        if (page.hasBookmark) {
            await storageManager.collection('bookmarks').createObject({
                url: page.url,
                time: Date.now(),
            })
        }
    }
    logic.processEvent('setAnnotationSearchResult', { result })
}

const defaultTestSetupDeps = {
    copyToClipboard: () => undefined,
}

export async function setupTest(
    device: UILogicTestDevice,
    args: {
        withAuth?: boolean
        runInitLogic?: boolean
        mockDocument?: any
        seedData?: DataSeeder
        overrideSearchTrigger?: boolean
        openFeedUrl?: () => void
        copyToClipboard?: (text: string) => Promise<boolean>
        renderUpdateNotifBanner?: () => JSX.Element
    } = {
        copyToClipboard: defaultTestSetupDeps.copyToClipboard,
    },
) {
    const analytics = new FakeAnalytics()

    if (args.withAuth) {
        await device.backgroundModules.auth.authService.loginWithEmailAndPassword(
            TEST_USER.email,
            'password',
        )
        await device.backgroundModules.auth.remoteFunctions.updateUserProfile({
            displayName: TEST_USER.displayName,
        })
    }

    const logic = new DashboardLogic({
        location,
        analytics,
        annotationsBG: insertBackgroundFunctionTab(
            device.backgroundModules.directLinking.remoteFunctions,
        ) as any,
        localStorage: device.browserAPIs.storage.local,
        authBG: device.backgroundModules.auth.remoteFunctions,
        personalCloudBG: device.backgroundModules.personalCloud.remoteFunctions,
        tagsBG: device.backgroundModules.tags.remoteFunctions,
        syncSettingsBG: device.backgroundModules.syncSettings.remoteFunctions,
        document: args.mockDocument,
        listsBG: {
            ...device.backgroundModules.customLists.remoteFunctions,
            insertPageToList: (fnArgs) =>
                device.backgroundModules.customLists.remoteFunctions.insertPageToList(
                    { ...fnArgs, skipPageIndexing: true },
                ),
        },
        searchBG: device.backgroundModules.search.remoteFunctions.search,
        backupBG: insertBackgroundFunctionTab(
            device.backgroundModules.backupModule.remoteFunctions,
        ) as any,
        contentShareBG: device.backgroundModules.contentSharing.remoteFunctions,
        pdfViewerBG: device.backgroundModules.pdfBg.remoteFunctions,
        contentConversationsBG:
            device.backgroundModules.contentConversations.remoteFunctions,
        activityIndicatorBG:
            device.backgroundModules.activityIndicator.remoteFunctions,
        copyToClipboard:
            args.copyToClipboard ?? defaultTestSetupDeps.copyToClipboard,
        openFeed: args.openFeedUrl ?? (() => undefined),
        openCollectionPage: () => {},
        renderUpdateNotifBanner: args.renderUpdateNotifBanner ?? (() => null),
        services: createUIServices(),
    })

    if (args.overrideSearchTrigger) {
        logic['searchTriggeredCount'] = 0

        logic['runSearch'] = (async () => {
            logic['searchTriggeredCount']++
        }) as any
    }

    const searchResults = device.createElement<RootState, Events>(logic)

    if (args.runInitLogic) {
        await searchResults.init()
    }
    if (args.seedData) {
        await args.seedData(searchResults, device)
    }

    return { searchResults, logic, analytics }
}

const getPrivacyLevel = (isShared, isBulkShareProtected) => {
    if (isShared && isBulkShareProtected) {
        return AnnotationPrivacyLevels.SHARED_PROTECTED
    } else if (isShared) {
        return AnnotationPrivacyLevels.SHARED
    } else if (isBulkShareProtected) {
        return AnnotationPrivacyLevels.PROTECTED
    } else {
        return AnnotationPrivacyLevels.PRIVATE
    }
}

const newPrivacyLevel = (
    oldPrivacyLevel: AnnotationPrivacyLevels,
    {
        isShared,
        isBulkShareProtected,
    }: { isShared: boolean; isBulkShareProtected: boolean },
) => {
    if (
        oldPrivacyLevel === AnnotationPrivacyLevels.PROTECTED ||
        oldPrivacyLevel === AnnotationPrivacyLevels.SHARED_PROTECTED
    ) {
        return oldPrivacyLevel
    } else {
        return getPrivacyLevel(isShared, isBulkShareProtected)
    }
}
export const objectMap = (obj, fn) =>
    Object.fromEntries(Object.entries(obj).map(([k, v], i) => [k, fn(v, k, i)]))

export const objectFilter = (obj, fn) =>
    Object.fromEntries(
        Object.entries(obj).filter(([k, v], i) => [k, fn(v, k, i)]),
    )

const makeNewShareState = (
    note,
    {
        isShared,
        isBulkShareProtected,
    }: { isShared: boolean; isBulkShareProtected?: boolean },
): AnnotationSharingState => {
    const privacyLevel = getPrivacyLevel(
        note.isShared,
        note.isBulkShareProtected,
    )
    return {
        hasLink: note.isShared ? true : false,
        remoteId: note.isShared ? '1' : null,
        sharedListIds: [], // TODO: maybe fill this in, if needed (it looks like only privacyLevel is used)
        privateListIds: note.lists ?? [],
        privacyLevel: newPrivacyLevel(privacyLevel, {
            isShared,
            isBulkShareProtected,
        }),
    }
}

export const makeNewShareStates = (
    notesById,
    {
        isShared,
        isBulkShareProtected,
    }: { isShared: boolean; isBulkShareProtected?: boolean },
): AnnotationSharingStates => {
    return objectMap(notesById, (v) => {
        return makeNewShareState(v, {
            isShared,
            isBulkShareProtected,
        })
    })
}
