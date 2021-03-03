import { browser } from 'webextension-polyfill-ts'
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
    logic.processEvent('setPageSearchResult', { result })
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
        seedData?: DataSeeder
        copyToClipboard?: (text: string) => Promise<boolean>
        overrideSearchTrigger?: boolean
        mockDocument?: any
    } = {
        copyToClipboard: defaultTestSetupDeps.copyToClipboard,
    },
) {
    const annotationsBG = insertBackgroundFunctionTab(
        device.backgroundModules.directLinking.remoteFunctions,
    ) as any

    const analytics = new FakeAnalytics()

    const logic = new DashboardLogic({
        analytics,
        annotationsBG,
        localStorage: browser.storage.local,
        authBG: device.backgroundModules.auth.remoteFunctions,
        tagsBG: device.backgroundModules.tags.remoteFunctions,
        document: args.mockDocument,
        listsBG: {
            ...device.backgroundModules.customLists.remoteFunctions,
            insertPageToList: (args) =>
                device.backgroundModules.customLists.remoteFunctions.insertPageToList(
                    { ...args, skipPageIndexing: true },
                ),
        },
        searchBG: device.backgroundModules.search.remoteFunctions.search,
        syncBG: device.backgroundModules.sync.remoteFunctions,
        backupBG: device.backgroundModules.backupModule.remoteFunctions,
        contentShareBG: device.backgroundModules.contentSharing.remoteFunctions,
        activityIndicatorBG:
            device.backgroundModules.activityIndicator.remoteFunctions,
        copyToClipboard:
            args.copyToClipboard ?? defaultTestSetupDeps.copyToClipboard,
        openFeedUrl: () => undefined,
    })

    if (args.overrideSearchTrigger) {
        logic['searchTriggeredCount'] = 0

        logic['runSearch'] = async () => {
            logic['searchTriggeredCount']++
        }
    }

    const searchResults = device.createElement<RootState, Events>(logic)

    if (args.seedData) {
        await args.seedData(searchResults, device)
    }

    return { searchResults, logic, analytics }
}
