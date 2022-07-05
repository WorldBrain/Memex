import type StorageManager from '@worldbrain/storex'
import type { PageList, PageListEntry } from 'src/custom-lists/background/types'
import type { SharedListMetadata } from 'src/content-sharing/background/types'
import type { AnnotListEntry } from 'src/annotations/types'

interface Dependencies {
    storageManager: StorageManager
    silenceLogging?: boolean
}

export async function removeDupeSpaces({
    storageManager,
    silenceLogging,
}: Dependencies) {
    const listIdsToDelete = new Set<number>()
    const listIdsToRename = new Map<number, string>()
    const pageEntriesToMove: PageListEntry[] = []
    const pageEntriesToDelete: PageListEntry[] = []
    const annotEntriesToMove: AnnotListEntry[] = []
    const annotEntriesToDelete: AnnotListEntry[] = []

    const listsById = new Map<number, PageList>()
    const listIdsByName = new Map<string, number[]>()
    const sharedIds = new Set<number>()

    const sortByOldestList = (listIds: number[]): PageList[] =>
        listIds
            .map((id) => listsById.get(id))
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    const customLists: PageList[] = await storageManager
        .collection('customLists')
        .findAllObjects({})
    const metadata: SharedListMetadata[] = await storageManager
        .collection('sharedListMetadata')
        .findAllObjects({
            localId: { $in: customLists.map((list) => list.id) },
        })

    // Create look-up indices for the existing data, to make it easier to calc things later
    for (const list of customLists) {
        listsById.set(list.id, list)

        const existingIds = listIdsByName.get(list.name) ?? []
        listIdsByName.set(list.name, [...existingIds, list.id])
    }
    for (const data of metadata) {
        sharedIds.add(data.localId)
    }

    // For those spaces that have the same names: figure out which ones to keep (are shared OR pick oldest)
    for (const [name, listIds] of listIdsByName) {
        if (listIds.length < 2) {
            continue
        }

        const idsToKeep = sortByOldestList(
            listIds.filter((id) => sharedIds.has(id)),
        ).map((list) => list.id)

        // If no shared lists, just keep the oldest one
        if (idsToKeep.length === 0) {
            idsToKeep.push(sortByOldestList(listIds)[0].id)
        }

        const mainListId = idsToKeep[0] // We might be keeping multiple lists. Pick the oldest one as the "main" list

        const idsToDelete = listIds.filter((id) => !idsToKeep.includes(id))

        // Grab all the entries for each list and set them up for deletion and repointing at the "main" list
        for (const id of idsToDelete) {
            listIdsToDelete.add(id)

            const pageListEntries: PageListEntry[] = await storageManager
                .collection('pageListEntries')
                .findObjects({ listId: id })
            const annotListEntries: AnnotListEntry[] = await storageManager
                .collection('annotListEntries')
                .findObjects({ listId: id })
            pageEntriesToDelete.push(...pageListEntries)
            annotEntriesToDelete.push(...annotListEntries)
            pageEntriesToMove.push(
                ...pageListEntries.map((entry) => ({
                    ...entry,
                    listId: mainListId,
                })),
            )
            annotEntriesToMove.push(
                ...annotListEntries.map((entry) => ({
                    ...entry,
                    listId: mainListId,
                })),
            )
        }

        // Set up extra lists for renaming (these will be kept because they're shared)
        idsToKeep
            .slice(1)
            .forEach((id, i) =>
                listIdsToRename.set(id, `${name} (duplicate #${i + 1})`),
            )
    }

    // Perform the needed DB deletions and updates
    await storageManager
        .collection('customLists')
        .deleteObjects({ id: { $in: [...listIdsToDelete] } })
    await storageManager.collection('pageListEntries').deleteObjects({
        listId: { $in: pageEntriesToDelete.map((entry) => entry.listId) },
        pageUrl: { $in: pageEntriesToDelete.map((entry) => entry.pageUrl) },
    })
    await storageManager.collection('annotListEntries').deleteObjects({
        listId: { $in: annotEntriesToDelete.map((entry) => entry.listId) },
        url: { $in: annotEntriesToDelete.map((entry) => entry.url) },
    })

    for (const entry of pageEntriesToMove) {
        await storageManager.collection('pageListEntries').createObject(entry)
    }
    for (const entry of annotEntriesToMove) {
        await storageManager.collection('annotListEntries').createObject(entry)
    }

    for (const [listId, name] of listIdsToRename) {
        await storageManager
            .collection('customLists')
            .updateOneObject({ id: listId }, { name })
    }

    if (!silenceLogging) {
        console.log('# removed duplicate local spaces: ', listIdsToDelete.size)
        console.log('# renamed duplicate shared spaces: ', listIdsToRename.size)
        console.log('# updated page entries: ', pageEntriesToMove.length)
        console.log('# updated annotation entries: ', annotEntriesToMove.length)
    }
}
