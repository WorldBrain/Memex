import type StorageManager from '@worldbrain/storex'
import type CustomListBackground from 'src/custom-lists/background'
import type { PageActivityIndicatorBackground } from 'src/page-activity-indicator/background'
import { PersonalCloudClientStorageType } from '@worldbrain/memex-common/lib/personal-cloud/backend/types'
import { StoredContentType } from 'src/page-indexing/background/types'
import { updateOrCreate } from '@worldbrain/storex/lib/utils'
import transformPageHTML from 'src/util/transform-page-html'
import transformPageText from 'src/util/transform-page-text'

interface IncomingDataInfo {
    storageType: PersonalCloudClientStorageType
    collection: string
    updates: { [key: string]: any }
    where?: { [key: string]: any }
}

export const handleIncomingData = (deps: {
    customListsBG: CustomListBackground
    pageActivityIndicatorBG: PageActivityIndicatorBackground
    persistentStorageManager: StorageManager
    storageManager: StorageManager
}) => async ({
    storageType,
    collection,
    updates,
    where,
}: IncomingDataInfo): Promise<void> => {
    const incomingStorageManager =
        storageType === PersonalCloudClientStorageType.Persistent
            ? deps.persistentStorageManager
            : deps.storageManager

    // Add any newly created lists to the list suggestion cache
    if (collection === 'customLists' && updates.id != null) {
        const existingList = await deps.storageManager.backend.operation(
            'findObject',
            collection,
            { id: updates.id },
        )

        if (existingList == null) {
            await deps.customListsBG.updateListSuggestionsCache({
                added: updates.id,
            })
        }
    }

    // WARNING: Keep in mind this skips all storage middleware
    await updateOrCreate({
        collection,
        updates,
        where,
        storageManager: incomingStorageManager,
        executeOperation: (...args: any[]) => {
            return (incomingStorageManager.backend.operation as any)(...args)
        },
    })

    // For any new incoming followedList, manually pull followedListEntries
    if (collection === 'followedList' && updates.sharedList != null) {
        await deps.pageActivityIndicatorBG.syncFollowedListEntries({
            forFollowedLists: [{ sharedList: updates.sharedList }],
        })
    }

    if (collection === 'docContent') {
        const { normalizedUrl, storedContentType } = where ?? {}
        const { content } = updates
        if (!normalizedUrl || !content) {
            console.warn(
                `Got an incoming page, but it didn't include a URL and a body`,
            )
            return
        }

        const processed =
            storedContentType === StoredContentType.HtmlBody
                ? transformPageHTML({
                      html: content,
                  }).text
                : transformPageText({
                      text: (content.pageTexts ?? []).join(' '),
                  }).text
        await deps.storageManager.backend.operation(
            'updateObjects',
            'pages',
            {
                url: normalizedUrl,
            },
            { text: processed },
        )
    }
}
