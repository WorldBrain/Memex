import { BackgroundIntegrationTestSetup } from 'src/tests/integration-tests'
import { injectFakeTabs } from 'src/tab-management/background/index.tests'

export const LIST_DATA = {
    name: 'My shared list',
}

export const PAGE_1_DATA = {
    pageDoc: {
        url: 'https://www.spam.com/foo',
        content: {
            title: 'Spam.com title',
        },
    },
    visits: [],
    rejectNoContent: false,
}

export const ENTRY_1_DATA = {
    url: 'https://www.spam.com/foo',
}

export const PAGE_2_DATA = {
    pageDoc: {
        url: 'https://www.eggs.com/foo',
        content: {
            title: 'Eggs.com title',
        },
    },
    visits: [],
    rejectNoContent: false,
}

export const ENTRY_2_DATA = {
    url: 'https://www.eggs.com/foo',
}

export const ANNOTATION_1_1_DATA = {
    pageUrl: ENTRY_1_DATA.url,
    title: 'Page title',
    body: 'Annot body',
    comment: 'Annot comment',
    selector: {
        descriptor: { content: [{ foo: 5 }], strategy: 'eedwdwq' },
        quote: 'dawadawd',
    },
}

export const ANNOTATION_1_2_DATA = {
    pageUrl: ENTRY_1_DATA.url,
    title: 'Page title',
    body: 'Annot body 2',
    comment: 'Annot comment 2',
    selector: {
        descriptor: { content: [{ foo: 10 }], strategy: 'eedwdwq 2' },
        quote: 'dawadawd 2',
    },
}

export async function createContentSharingTestList(
    setup: BackgroundIntegrationTestSetup,
    options?: { dontIndexPages?: boolean },
) {
    const localListId = await setup.backgroundModules.customLists.createCustomList(
        LIST_DATA,
    )
    injectFakeTabs({
        tabManagement: setup.backgroundModules.tabManagement,
        tabsAPI: setup.browserAPIs.tabs,
        includeTitle: true,
        tabs: [
            {
                url: PAGE_1_DATA.pageDoc.url,
                title: PAGE_1_DATA.pageDoc.content.title,
            },
            {
                url: PAGE_2_DATA.pageDoc.url,
                title: PAGE_2_DATA.pageDoc.content.title,
            },
        ],
    })
    await setup.backgroundModules.customLists.insertPageToList({
        id: localListId,
        ...ENTRY_1_DATA,
        skipPageIndexing: options?.dontIndexPages,
        suppressInboxEntry: true,
    })
    await setup.backgroundModules.customLists.insertPageToList({
        id: localListId,
        ...ENTRY_2_DATA,
        skipPageIndexing: options?.dontIndexPages,
        suppressInboxEntry: true,
    })

    return localListId
}

export async function shareContentSharingTestList(
    setup: BackgroundIntegrationTestSetup,
    localListId: number,
) {
    const listShareResult = await setup.backgroundModules.contentSharing.shareList(
        {
            listId: localListId,
        },
    )
    return listShareResult.remoteListId
}
