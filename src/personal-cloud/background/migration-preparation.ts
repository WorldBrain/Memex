import type StorageManager from '@worldbrain/storex'

async function findAllObjectsChunked<T = any>(args: {
    db: StorageManager
    collection: string
    chunkSize: number
    cb: (objs: T[]) => Promise<void>
}) {
    let skip = 0
    let objs: T[]

    do {
        objs = await args.db
            .collection(args.collection)
            .findAllObjects({}, { skip, limit: args.chunkSize })
        skip += args.chunkSize
        await args.cb(objs)
    } while (objs.length === args.chunkSize)
}

// NOTE: the order of steps in this function matters a lot!
export async function prepareDataMigration({
    db,
    queueObjs,
}: {
    db: StorageManager
    queueObjs: (collection: string, objs: any[]) => Promise<void>
}): Promise<void> {
    const queueAllObjects = async (
        collection: string,
        args?: { chunked: boolean },
    ) => {
        if (args?.chunked) {
            await findAllObjectsChunked({
                db,
                chunkSize: 500,
                collection: collection,
                cb: async (objs) => queueObjs(collection, objs),
            })
        } else {
            const objs = await db.collection(collection).findAllObjects({})
            await queueObjs(collection, objs)
        }
    }

    // Step 1.1: pages
    await queueAllObjects('pages', { chunked: true })

    // Step 1.2: visits
    await queueAllObjects('visits', { chunked: true })

    // Step 1.3: bookmarks
    await queueAllObjects('bookmarks')

    // Step 2.1: annotations
    await queueAllObjects('annotations')

    // Step 2.2: annotation privacy levels
    await queueAllObjects('annotationPrivacyLevels')

    // Step 2.3: annotation share metadata
    await queueAllObjects('sharedAnnotationMetadata')

    // Step 3.1: lists
    await queueAllObjects('customLists')

    // Step 3.2: list entries
    await queueAllObjects('pageListEntries')

    // Step 3.3: list share metadata
    await queueAllObjects('sharedListMetadata')

    // Step 4.1: tags
    await queueAllObjects('tags')

    // Step 4.2: settings
    await queueAllObjects('settings')

    // Step 4.3: copy-paster templates
    await queueAllObjects('templates')

    // Step 5.1: fav-icons
    // await queueAllObjects('templates')
}
