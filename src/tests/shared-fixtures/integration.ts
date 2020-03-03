import StorageManager from '@worldbrain/storex'
import { BackgroundModules } from 'src/background-script/setup'

type IntegrationTestDataCollection =
    | 'pages'
    | 'bookmarks'
    | 'tags'
    | 'customLists'
    | 'pageListEntries'
    | 'annotations'
    | 'annotationBookmarks'
    | 'annotationListEntries'

export async function insertIntegrationTestData(
    device: {
        backgroundModules: BackgroundModules
        storageManager: StorageManager
    },
    options?: {
        collections?: { [Key in IntegrationTestDataCollection]?: boolean }
    },
) {
    const { backgroundModules } = device
    const includeCollection = (collection: IntegrationTestDataCollection) =>
        !options?.collections || options.collections[collection]
    const pages = [{ url: 'http://www.bla.com/' }]

    if (includeCollection('pages')) {
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
    }

    let listId: number
    const includeLists = includeCollection('customLists')
    if (includeLists) {
        listId = await backgroundModules.customLists.createCustomList({
            name: 'My list',
        })
        if (includeCollection('pageListEntries')) {
            await backgroundModules.customLists.insertPageToList({
                id: listId,
                url: pages[0].url,
            })
        }
    }
    if (includeCollection('bookmarks')) {
        await backgroundModules.bookmarks.addBookmark({
            url: pages[0].url,
            time: new Date('2019-10-10').getTime(),
        })
    }
    if (includeCollection('tags')) {
        await backgroundModules.tags.addTagToExistingUrl({
            tag: 'my-tag',
            url: pages[0].url,
        })
    }

    let annotUrl: string
    const includeAnnotations = includeCollection('annotations')
    if (includeAnnotations) {
        annotUrl = await backgroundModules.directLinking.createAnnotation(
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
        if (includeCollection('annotationBookmarks')) {
            await backgroundModules.directLinking.toggleAnnotBookmark(
                {
                    tab: null as any,
                },
                { url: annotUrl },
            )
        }
    }
    if (
        includeCollection('annotationListEntries') &&
        includeCollection &&
        includeAnnotations
    ) {
        await backgroundModules.directLinking.insertAnnotToList(
            { tab: null },
            {
                listId,
                url: annotUrl,
            },
        )
    }

    return { pages }
}
