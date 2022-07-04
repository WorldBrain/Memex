import type StorageManager from '@worldbrain/storex'
import type { PageList, PageListEntry } from 'src/custom-lists/background/types'
import type { SharedListMetadata } from 'src/content-sharing/background/types'
import type { AnnotListEntry } from 'src/annotations/types'

interface Dependencies {
    storageManager: StorageManager
}

export async function removeDupeSpaces({ storageManager }: Dependencies) {
    const customLists: PageList[] = await storageManager
        .collection('customLists')
        .findAllObjects({})
    const metadata: SharedListMetadata[] = await storageManager
        .collection('sharedListMetadata')
        .findAllObjects({
            localId: { $in: customLists.map((list) => list.id) },
        })

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

    // index IDs by name
    for (const list of customLists) {
        listsById.set(list.id, list)

        const existingIds = listIdsByName.get(list.name) ?? []
        listIdsByName.set(list.name, [...existingIds, list.id])
    }

    for (const data of metadata) {
        sharedIds.add(data.localId)
    }

    // For those with multiple IDs: look up share links, choose ones to keep
    for (const [name, listIds] of listIdsByName) {
        if (listIds.length < 2) {
            continue
        }

        const idsToKeep = sortByOldestList(
            listIds.filter((id) => sharedIds.has(id)),
        ).map((list) => list.id)

        // If no shared lists to keep, keep the oldest one
        if (idsToKeep.length === 0) {
            idsToKeep.push(sortByOldestList(listIds)[0].id)
        }

        // Find list entries for the lists that will be delated
        const idsToDelete = listIds.filter((id) => !idsToKeep.includes(id))

        const mainListId = idsToKeep[0] // We might be keeping multiple lists. Pick the oldest one as the "main" list

        // Grab all the entries and repoint them at the main list
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

        // Set up lists for renaming
        idsToKeep
            .slice(1)
            .forEach((id, i) =>
                listIdsToRename.set(id, `${name} (duplicate #${i + 1})`),
            )
    }

    // Delete the lists
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
}
