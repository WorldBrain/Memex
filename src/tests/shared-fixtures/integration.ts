import StorageManager from '@worldbrain/storex'
import { BackgroundModules } from 'src/background-script/setup'

export async function insertIntegrationTestData(params: {
    backgroundModules: BackgroundModules
    storageManager: StorageManager
}) {
    const { backgroundModules } = params
    const pages = [{ url: 'http://www.bla.com/' }]

    await backgroundModules.search.searchIndex.addPage({
        pageDoc: {
            url: pages[0].url,
            content: {
                fullText: 'home page content',
                title: 'bla.com title',
            },
        },
        visits: [new Date('2019-10-09').getTime()],
    })
    const listId = await backgroundModules.customLists.createCustomList({
        name: 'My list',
    })
    await backgroundModules.customLists.insertPageToList({
        id: listId,
        url: pages[0].url,
    })
    await backgroundModules.bookmarks.addBookmark({
        url: pages[0].url,
        time: new Date('2019-10-10').getTime(),
    })
    await backgroundModules.tags.addTag({
        tag: 'my-tag',
        url: pages[0].url,
    })
    const annotUrl = await backgroundModules.directLinking.createAnnotation(
        { tab: {} as any },
        {
            url: pages[0].url,
            title: 'test',
            comment: 'test comment',
            createdWhen: new Date('2019-10-11'),
            body: 'test body',
            selector: 'test selector',
            bookmarked: false,
            isSocialPost: false,
        },
        { skipPageIndexing: true },
    )
    await backgroundModules.directLinking.toggleAnnotBookmark(
        {
            tab: null as any,
        },
        { url: annotUrl },
    )
    await backgroundModules.directLinking.insertAnnotToList(
        { tab: null },
        {
            listId,
            url: annotUrl,
        },
    )
}
