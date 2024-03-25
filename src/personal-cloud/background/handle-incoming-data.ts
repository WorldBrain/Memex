import type StorageManager from '@worldbrain/storex'
import type CustomListBackground from 'src/custom-lists/background'
import type { PageActivityIndicatorBackground } from 'src/page-activity-indicator/background'
import { PersonalCloudClientStorageType } from '@worldbrain/memex-common/lib/personal-cloud/backend/types'
import { StoredContentType } from 'src/page-indexing/background/types'
import { updateOrCreate } from '@worldbrain/storex/lib/utils'
import { transformPageHTML } from '@worldbrain/memex-stemmer/lib/transform-page-html.service-worker'
import { transformPageText } from '@worldbrain/memex-stemmer/lib/transform-page-text'
import type { PKMSyncBackgroundModule } from 'src/pkm-integrations/background'
import {
    isPkmSyncEnabled,
    shareAnnotationWithPKM,
    sharePageWithPKM,
} from 'src/pkm-integrations/background/backend/utils'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import type { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import type { Browser } from 'webextension-polyfill'

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
    pkmSyncBG: PKMSyncBackgroundModule
    imageSupport: ImageSupportInterface
    browserAPIs: Browser
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
    try {
        await handleSyncedDataForPKMSync(
            deps.pkmSyncBG,
            collection,
            updates,
            where,
            deps.storageManager,
            deps.imageSupport,
            deps.browserAPIs,
        )
    } catch (e) {}
}

async function handleSyncedDataForPKMSync(
    pkmSyncBG: PKMSyncBackgroundModule,
    collection,
    updates,
    where,
    storageManager: StorageManager,
    imageSupport: ImageSupportInterface,
    browserAPIs: Browser,
) {
    async function checkIfAnnotationInfilteredList({
        url,
        listNames,
    }: {
        url: string
        listNames: string[]
    }): Promise<boolean> {
        const listEntries = await storageManager.backend.operation(
            'findObjects',
            'annotListEntries',
            { url: url },
        )

        if (listEntries.length === 0) {
            return false
        }

        for (const listEntry of listEntries) {
            const listData = await storageManager.backend.operation(
                'findObject',
                'customLists',
                {
                    id: listEntry.listId,
                },
            )
            const listName = listData.name

            if (listNames.includes(listName)) {
                return true
            }
        }
    }
    async function checkIfPageInfilteredList({
        url,
        listNames,
    }: {
        url: string
        listNames: string[]
    }): Promise<boolean> {
        let listEntries = await storageManager.backend.operation(
            'findObjects',
            'pageListEntries',
            { pageUrl: url },
        )

        if (listEntries.length === 0) {
            return false
        }

        listEntries = listEntries.filter((item) => item != 20201014)

        for (const listEntry of listEntries) {
            const listData = await storageManager.backend.operation(
                'findObject',
                'customLists',
                {
                    id: listEntry.listId,
                },
            )
            const listName = listData.name

            if (listNames.includes(listName)) {
                return true
            }
        }
    }

    try {
        if (await isPkmSyncEnabled({ storageAPI: browserAPIs.storage })) {
            if (collection === 'annotations') {
                const pageDataStorage = await storageManager
                    .collection('pages')
                    .findOneObject<{
                        fullTitle: string
                        fullUrl: string
                    }>({
                        url: updates.url.split('/#')[0],
                    })

                const visitsStorage = await storageManager
                    .collection('visits')
                    .findOneObject<{ time: string }>({
                        url: normalizeUrl(updates.url.split('/#')[0]),
                    })
                const pageDate = visitsStorage.time

                const annotationData = {
                    annotationId: updates.url,
                    pageTitle: updates.pageTitle,
                    pageUrl: pageDataStorage.fullUrl,
                    body: updates.body,
                    comment: updates.comment,
                    createdWhen: updates.createdWhen,
                    pageCreatedWhen: pageDate,
                }

                await shareAnnotationWithPKM(
                    annotationData,
                    pkmSyncBG,
                    imageSupport,
                    async (url, listNames) =>
                        await checkIfAnnotationInfilteredList({
                            url: url,
                            listNames: listNames,
                        }),
                )
            }

            if (collection === 'annotListEntries') {
                const listData = await storageManager
                    .collection('customLists')
                    .findOneObject<{ id: number; name: string }>({
                        id: updates.listId,
                    })
                const pageDataStorage = await storageManager
                    .collection('pages')
                    .findOneObject<{
                        fullTitle: string
                        fullUrl: string
                        createdWhen: string
                    }>({
                        url: updates.url.split('/#')[0],
                    })
                const annotationDataStorage = await storageManager
                    .collection('annotations')
                    .findOneObject<{
                        body: string
                        comment: string
                        createdWhen: string
                    }>({
                        url: updates.url,
                    })
                const visitsStorage = await storageManager
                    .collection('visits')
                    .findOneObject<{ time: string }>({
                        url: normalizeUrl(updates.url.split('/#')[0]),
                    })
                const pageDate = visitsStorage.time

                const annotationData = {
                    annotationId: updates.url,
                    pageTitle: pageDataStorage.fullTitle,
                    pageUrl: pageDataStorage.fullUrl,
                    annotationSpaces: listData?.name,
                    pageCreatedWhen: pageDate,
                    body: annotationDataStorage.body,
                    comment: annotationDataStorage.comment,
                    createdWhen: annotationDataStorage.createdWhen,
                }

                await shareAnnotationWithPKM(
                    annotationData,
                    pkmSyncBG,
                    imageSupport,
                    async (url, listNames) =>
                        await checkIfAnnotationInfilteredList({
                            url: url,
                            listNames: listNames,
                        }),
                )
            }
            if (collection === 'pages') {
                if (!updates.fullTitle) {
                    const xhr = new XMLHttpRequest()
                    xhr.open('GET', updates.fullUrl, false)
                    xhr.send()
                    const doc = new DOMParser().parseFromString(
                        xhr.responseText,
                        'text/html',
                    )
                    updates.fullTitle =
                        doc
                            .querySelector('meta[property="og:title"]')
                            ?.getAttribute('content') || doc.title
                }

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
                    .findOneObject<{ id: number; name: string }>({
                        id: updates.listId,
                    })

                let pageDataStorage = await storageManager
                    .collection('pages')
                    .findOneObject<{ fullTitle: string }>({
                        url: normalizeUrl(updates.fullUrl),
                    })

                if (!pageDataStorage.fullTitle) {
                    const xhr = new XMLHttpRequest()
                    xhr.open('GET', updates.fullUrl, false)
                    xhr.send()
                    const doc = new DOMParser().parseFromString(
                        xhr.responseText,
                        'text/html',
                    )
                    pageDataStorage.fullTitle =
                        doc
                            .querySelector('meta[property="og:title"]')
                            ?.getAttribute('content') || doc.title
                }

                const pageData = {
                    pageTitle: pageDataStorage.fullTitle,
                    createdWhen: Date.now(),
                    pageUrl: updates.fullUrl,
                    pageSpaces: listData.name,
                }

                await sharePageWithPKM(
                    pageData,
                    pkmSyncBG,
                    async (url, listNames) =>
                        await checkIfPageInfilteredList({
                            url: normalizeUrl(url),
                            listNames: listNames,
                        }),
                )
            }
        }
    } catch (e) {
        console.error(e)
    }
}
