import type StorageManager from '@worldbrain/storex'

// NOTE: the order of steps in this function matters a lot!
export async function prepareDataMigration(args: {
    db: StorageManager
    queueObjs: (collection: string, objs: any[]) => Promise<void>
}): Promise<void> {
    // Step 1.1: pages
    // Step 1.2: visits
    // Step 1.3: bookmarks
    // Step 2.1: annotations
    // Step 2.2: annotation privacy levels
    // Step 2.3: annotation share metadata
    // Step 3.1: lists
    // Step 3.2: list entries
    // Step 3.3: list share metadata
    // Step 4.1: tags
    // Step 4.2: settings
    // Step 4.3: copy-paster templates
    // Step 5.1: fav-icons
}
