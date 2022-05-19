import type { BulkError, default as Dexie } from 'dexie'
import { isUrlForAnnotation } from '@worldbrain/memex-common/lib/annotations/utils'
import { listNameStemmer } from '@worldbrain/memex-stemmer'
import type { PageListEntry } from 'src/custom-lists/background/types'
import type { AnnotListEntry } from 'src/annotations/types'
import * as Raven from 'src/util/raven'

interface Dependencies {
    dexie: Dexie
    queueChangesForCloudSync: (actionData: {
        collection: string
        objs: any[]
    }) => Promise<void>
    chunkSize?: number
}

const handleBulkAddError = (
    totalDocCount: number,
    docType: 'spaces' | 'page entries' | 'annotation entries',
) => (e: BulkError) =>
    console.warn(
        `${
            Object.values(e.failures).length
        } ${docType} failed to be created. However, ${
            totalDocCount - Object.values(e.failures).length
        } ${docType} were created successfully.`,
    )

export async function migrateTagsToSpaces({
    dexie,
    queueChangesForCloudSync,
    chunkSize = 100,
}: Dependencies): Promise<void> {
    await dexie.transaction(
        'rw',
        [
            'tags',
            'customLists',
            'pageListEntries',
            'annotListEntries',
            'personalCloudAction',
        ],
        async () => {
            const forEachTagChunk = async (
                cb: (
                    tags: Array<{ name: string; url: string }>,
                ) => Promise<void>,
            ) => {
                let pks: Array<[string, string]>
                let chunk = 0
                do {
                    pks = (await dexie
                        .table('tags')
                        .toCollection()
                        .offset(chunk * chunkSize)
                        .limit(chunkSize)
                        .primaryKeys()) as any
                    await cb(pks.map((pk) => ({ name: pk[0], url: pk[1] })))
                    chunk++
                } while (pks.length === chunkSize)
            }

            const seenTags = new Set<string>()
            const listNamesToIds = new Map<string, number>()
            let listIdCounter = Date.now()

            await forEachTagChunk(async (tags) => {
                const newLists = new Set<string>(
                    tags
                        .filter((tag) => !seenTags.has(tag.name))
                        .map((tag) => tag.name),
                )

                if (newLists.size) {
                    // Ensure we use existing lists if they have the same names
                    const existingLists = (await dexie
                        .table('customLists')
                        .where('name')
                        .anyOf([...newLists])
                        .toArray()) as Array<{ name: string; id: number }>
                    existingLists.forEach((list) => {
                        newLists.delete(list.name)
                        listNamesToIds.set(list.name, list.id)
                    })

                    const customListData = [...newLists].map((name) => {
                        listIdCounter++
                        listNamesToIds.set(name, listIdCounter)
                        return {
                            name,
                            id: listIdCounter,
                            createdAt: new Date(listIdCounter),
                            searchableName: name,
                            nameTerms: [...listNameStemmer(name)],
                            isDeletable: true,
                            isNestable: true,
                        }
                    })

                    await dexie
                        .table('customLists')
                        .bulkAdd(customListData)
                        .catch(
                            handleBulkAddError(customListData.length, 'spaces'),
                        )
                    await queueChangesForCloudSync({
                        collection: 'customLists',
                        objs: customListData,
                    })
                    newLists.forEach((listName) => seenTags.add(listName))
                }

                // Check if URL points to annotation or page
                const pageListEntryData: PageListEntry[] = []
                const annotListEntryData: Array<
                    AnnotListEntry & { createdAt: Date }
                > = []
                for (const tag of tags) {
                    const listId = listNamesToIds.get(tag.name)
                    if (listId == null) {
                        Raven.captureException(
                            new Error(
                                `Tags migration: List ID not found for tag name: ${tag.name}`,
                            ),
                        )
                        continue
                    }

                    if (isUrlForAnnotation(tag.url)) {
                        annotListEntryData.push({
                            listId,
                            url: tag.url,
                            createdAt: new Date(),
                        })
                    } else {
                        pageListEntryData.push({
                            listId,
                            pageUrl: tag.url,
                            fullUrl: 'https://' + tag.url,
                            createdAt: new Date(),
                        })
                    }
                }

                await dexie
                    .table('pageListEntries')
                    .bulkAdd(pageListEntryData)
                    .catch(
                        handleBulkAddError(
                            pageListEntryData.length,
                            'page entries',
                        ),
                    )
                await queueChangesForCloudSync({
                    collection: 'pageListEntries',
                    objs: pageListEntryData,
                })
                await dexie
                    .table('annotListEntries')
                    .bulkAdd(annotListEntryData)
                    .catch(
                        handleBulkAddError(
                            annotListEntryData.length,
                            'annotation entries',
                        ),
                    )
                await queueChangesForCloudSync({
                    collection: 'annotListEntries',
                    objs: annotListEntryData,
                })
            })
        },
    )
}
