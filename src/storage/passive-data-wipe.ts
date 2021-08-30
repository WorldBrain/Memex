import type Dexie from 'dexie'

const differenceSets = <T extends string | number>(
    a: Set<T>,
    b: Set<T>,
): Set<T> => new Set([...a].filter((val) => !b.has(val)))

const _wipePassiveData = (args: { db: Dexie }) => async (): Promise<void> => {
    // Adds urls and pageUrls from active data into an activeUrls set
    const t_bookmarks = await args.db
        .table('bookmarks')
        .toCollection()
        .primaryKeys()
    const t_annotations = await args.db
        .table('annotations')
        .orderBy('pageUrl')
        .uniqueKeys()
    const t_collections = await args.db
        .table('pageListEntries')
        .orderBy('pageUrl')
        .uniqueKeys()
    const t_tags = await args.db.table('tags').orderBy('url').uniqueKeys()

    const activePageUrls = new Set([
        ...t_bookmarks,
        ...t_annotations,
        ...t_collections,
        ...t_tags,
    ] as string[])

    // Adds stored pages to a set to find the difference - orphanPageUrls
    const t_pages = await args.db.table('pages').toCollection().primaryKeys()
    const allPageUrls = new Set(t_pages as string[])
    const orphanPageUrls = differenceSets(allPageUrls, activePageUrls)

    // Do the deletes
    await args.db
        .table('visits')
        .where('url')
        .anyOf([...orphanPageUrls])
        .delete()
    const numDeletedPages = await args.db
        .table('pages')
        .where('url')
        .anyOf([...orphanPageUrls])
        .delete()

    if (numDeletedPages === 0) {
        return
    }

    // After Pages have been deleted, check to see if any favIcons now can be deleted
    const t_pageHostnames = await args.db
        .table('pages')
        .orderBy('hostname')
        .uniqueKeys()
    const pageHostnames = new Set(t_pageHostnames as string[])

    await args.db
        .table('favIcons')
        .where('hostname')
        .noneOf([...pageHostnames])
        .delete()
}

export const wipePassiveData = (args: { db: Dexie }) =>
    args.db.transaction(
        'rw!',
        [
            'tags',
            'pages',
            'visits',
            'favIcons',
            'bookmarks',
            'annotations',
            'pageListEntries',
        ],
        _wipePassiveData(args),
    )
