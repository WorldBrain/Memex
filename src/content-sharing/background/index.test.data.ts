import { BackgroundIntegrationTestSetup } from 'src/tests/integration-tests'

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

export const ANNOTATION_1_DATA = {
    pageUrl: ENTRY_1_DATA.url,
    title: 'Page title',
    body: 'Annot body',
    comment: 'Annot comment',
    selector: {
        descriptor: { content: { foo: 5 }, strategy: 'eedwdwq' },
        quote: 'dawadawd',
    },
}

export async function createContentSharingTestList(
    setup: BackgroundIntegrationTestSetup,
) {
    const localListId = await setup.backgroundModules.customLists.createCustomList(
        LIST_DATA,
    )
    await setup.backgroundModules.search.searchIndex.addPage(PAGE_1_DATA)
    await setup.backgroundModules.customLists.insertPageToList({
        id: localListId,
        ...ENTRY_1_DATA,
    })
    await setup.backgroundModules.search.searchIndex.addPage(PAGE_2_DATA)
    await setup.backgroundModules.customLists.insertPageToList({
        id: localListId,
        ...ENTRY_2_DATA,
    })

    return localListId
}
