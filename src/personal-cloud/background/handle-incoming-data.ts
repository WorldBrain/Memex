import type StorageManager from '@worldbrain/storex'
import type CustomListBackground from 'src/custom-lists/background'
import type { PageActivityIndicatorBackground } from 'src/page-activity-indicator/background'
import { PersonalCloudClientStorageType } from '@worldbrain/memex-common/lib/personal-cloud/backend/types'
import { StoredContentType } from 'src/page-indexing/background/types'
import { updateOrCreate } from '@worldbrain/storex/lib/utils'
import { transformPageHTML } from '@worldbrain/memex-stemmer/lib/transform-page-html'
import { transformPageText } from '@worldbrain/memex-stemmer/lib/transform-page-text'
import { PkmSyncInterface } from 'src/pkm-integrations/background/types'
import {
    shareAnnotationWithPKM,
    sharePageWithPKM,
} from 'src/pkm-integrations/background/backend/utils'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'

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
    pkmSyncBG: PkmSyncInterface
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
                : transformPageText((content.pageTexts ?? []).join(' ')).text
        await deps.storageManager.backend.operation(
            'updateObjects',
            'pages',
            {
                url: normalizedUrl,
            },
            { text: processed },
        )
    }
    handleSyncedDataForPKMSync(
        deps.pkmSyncBG,
        collection,
        updates,
        where,
        deps.storageManager,
    )
}

async function handleSyncedDataForPKMSync(
    pkmSyncBG: PkmSyncInterface,
    collection,
    updates,
    where,
    storageManager: StorageManager,
) {
    if (collection === 'annotations') {
        const annotationData = {
            annotationId: updates.url,
            pageTitle: updates.pageTitle,
            body: updates.body,
            comment: updates.comment,
            createdWhen: updates.createdWhen,
        }

        await shareAnnotationWithPKM(annotationData, pkmSyncBG)
    }

    if (collection === 'annotListEntries') {
        const listData = await storageManager
            .collection('customLists')
            .findOneObject<{ id: number; name: string }>({ id: updates.listId })
        const pageDataStorage = await storageManager
            .collection('pages')
            .findOneObject<{ fullTitle: string; fullUrl: string }>({
                url: updates.url.split('/#')[0],
            })

        const annotationData = {
            pageTitle: pageDataStorage.fullTitle,
            annotationId: updates.url,
            pageUrl: pageDataStorage.fullUrl,
            annotationSpaces: listData.name,
        }

        await shareAnnotationWithPKM(annotationData, pkmSyncBG)
    }
    if (collection === 'pages') {
        const pageData = {
            pageTitle: updates.fullTitle,
            pageUrl: updates.fullUrl,
            createdWhen: Date.now(),
        }

        await sharePageWithPKM(pageData, pkmSyncBG)
    }
    if (collection === 'pageListEntries') {
        const listData = await storageManager
            .collection('customLists')
            .findOneObject<{ id: number; name: string }>({ id: updates.listId })
        const pageDataStorage = await storageManager
            .collection('pages')
            .findOneObject<{ fullTitle: string }>({
                url: normalizeUrl(updates.fullUrl),
            })

        const pageData = {
            pageTitle: pageDataStorage.fullTitle,
            createdWhen: updates.createdAt,
            pageUrl: updates.fullUrl,
            pageSpaces: listData.name,
        }

        await sharePageWithPKM(pageData, pkmSyncBG)
    }
}
