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
import type { ImageSupportBackground } from 'src/image-support/background'
import type { Browser } from 'webextension-polyfill'
import type { Annotation } from '@worldbrain/memex-common/lib/types/core-data-types/client'

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
    imageSupportBG: ImageSupportBackground
    pkmSyncBG: PKMSyncBackgroundModule
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

    if (collection === 'annotations') {
        // TODO: do something with these promises, but don't hold up sync
        const uploadPromises = maybeReplaceAnnotCommentImages(
            updates as Annotation,
            deps.imageSupportBG,
        )
    }

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

// We had a bug where annotation comments contained data URLs for big images, which blows up the extension on storage ops.
//  This makes sure they get uploaded and replaced with links.
function maybeReplaceAnnotCommentImages(
    annotation: Pick<Annotation, 'comment' | 'url' | 'pageUrl'>,
    imageSupportBG: ImageSupportBackground,
): Promise<void>[] {
    // Should match the data URL part of a markdown string containing something like this: "![alt text](data:image/png;base64,asdafasf)"
    const dataUrlExtractRegexp = /!\[.*?\]\((data:image\/(?:png|jpeg|gif);base64,[\w+/=]+)\)/g
    // Most comments should exit here
    if (!dataUrlExtractRegexp.test(annotation.comment)) {
        return []
    }
    dataUrlExtractRegexp.lastIndex = 0 // Reset lastIndex to 0
    const matches = annotation.comment.matchAll(dataUrlExtractRegexp)
    const dataUrlToImageId = new Map<string, string>()
    const imageUploadPromises: Promise<void>[] = []
    // For each found data URL, upload it and generate an ID
    for (const matchRes of matches) {
        const dataUrl = matchRes?.[1]
        if (!dataUrl) {
            continue
        }
        const imageId = imageSupportBG.generateImageId()
        imageUploadPromises.push(
            imageSupportBG.uploadImage({
                id: imageId,
                image: dataUrl,
                annotationUrl: annotation.url,
                normalizedPageUrl: annotation.pageUrl,
            }),
        )
        dataUrlToImageId.set(dataUrl, imageId)
    }
    // Replace all markdown data URL image links with HTML ones using the generated ID
    annotation.comment = annotation.comment.replace(
        dataUrlExtractRegexp,
        (_, dataUrl) => {
            if (!dataUrl) {
                return '' // Wipe it out if this match fails
            }
            const imageId = dataUrlToImageId.get(dataUrl)
            return `<img src="${imageId}" remoteid="${imageId}"/>`
        },
    )

    return imageUploadPromises
}
