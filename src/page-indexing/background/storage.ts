import flatten from 'lodash/flatten'
import {
    StorageModule,
    StorageModuleConfig,
    StorageModuleConstructorArgs,
} from '@worldbrain/storex-pattern-modules'
import { COLLECTION_DEFINITIONS as PAGE_COLLECTION_DEFINITIONS } from '@worldbrain/memex-common/lib/storage/modules/pages/constants'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import type { PipelineRes, VisitInteraction } from 'src/search'
import { initErrHandler } from 'src/search/storage'
import { getTermsField } from '@worldbrain/memex-common/lib/storage/utils'
import {
    mergeTermFields,
    fingerprintsEqual,
    isTempPdfAccessUrl,
} from '@worldbrain/memex-common/lib/page-indexing/utils'
import {
    ContentIdentifier,
    ContentLocator,
} from '@worldbrain/memex-common/lib/page-indexing/types'
import decodeBlob from 'src/util/decode-blob'
import {
    ContentFingerprint,
    LocationSchemeType,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import {
    isPkmSyncEnabled,
    sharePageWithPKM,
} from 'src/pkm-integrations/background/backend/utils'
import type { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import type {
    Bookmark,
    PageEntity,
    PageMetadata,
    Visit,
} from '@worldbrain/memex-common/lib/types/core-data-types/client'
import type { PageMetadataUpdateArgs } from './types'
import type { Storage } from 'webextension-polyfill'

export default class PageStorage extends StorageModule {
    disableBlobProcessing = false

    constructor(
        private options: StorageModuleConstructorArgs & {
            /** Please do not add new references to this. Access to be refactored to a higher level. */
            ___storageAPI: Storage.Static
        },
    ) {
        super(options)
    }

    getConfig = (): StorageModuleConfig => ({
        collections: {
            ...PAGE_COLLECTION_DEFINITIONS,
        },
        operations: {
            createPage: {
                operation: 'createObject',
                collection: 'pages',
            },
            updatePage: {
                operation: 'updateObject',
                collection: 'pages',
                args: [{ url: '$url:string' }, '$updates'],
            },
            findPageByUrl: {
                operation: 'findObject',
                collection: 'pages',
                args: {
                    url: '$url:string',
                },
            },
            deletePage: {
                operation: 'deleteObject',
                collection: 'pages',
                args: {
                    url: '$url:string',
                },
            },
            createPageMetadata: {
                operation: 'createObject',
                collection: 'pageMetadata',
            },
            findPageMetadata: {
                operation: 'findObject',
                collection: 'pageMetadata',
                args: {
                    normalizedPageUrl: '$normalizedPageUrl:string',
                },
            },
            updatePageMetadata: {
                operation: 'updateObject',
                collection: 'pageMetadata',
                args: [
                    {
                        normalizedPageUrl: '$normalizedPageUrl:string',
                    },
                    {
                        doi: '$doi:string',
                        title: '$title:string',
                        annotation: '$annotation:string',
                        sourceName: '$sourceName:string',
                        journalName: '$journalName:string',
                        journalPage: '$journalPage:string',
                        journalIssue: '$journalIssue:string',
                        journalVolume: '$journalVolume:string',
                        releaseDate: '$releaseDate:number',
                        accessDate: '$accessDate:number',
                    },
                ],
            },
            deletePageMetadata: {
                operation: 'deleteObject',
                collection: 'pageMetadata',
                args: {
                    normalizedPageUrl: '$normalizedPageUrl:string',
                },
            },
            createPageEntity: {
                operation: 'createObject',
                collection: 'pageEntities',
            },
            findPageEntitiesByUrl: {
                operation: 'findObjects',
                collection: 'pageEntities',
                args: {
                    normalizedPageUrl: '$normalizedPageUrl:string',
                },
            },
            updatePageEntity: {
                operation: 'updateObject',
                collection: 'pageEntities',
                args: [
                    {
                        id: '$id:number',
                    },
                    {
                        name: '$name:string',
                        isPrimary: '$isPrimary:boolean',
                        additionalName: '$additionalName:string',
                    },
                ],
            },
            updatePageEntityOrder: {
                operation: 'updateObject',
                collection: 'pageEntities',
                args: [{ id: '$id:number' }, { order: '$order:number' }],
            },
            deletePageEntitiesByUrl: {
                operation: 'deleteObjects',
                collection: 'pageEntities',
                args: { normalizedPageUrl: '$normalizedPageUrl:string' },
            },
            deletePageEntity: {
                operation: 'deleteObject',
                collection: 'pageEntities',
                args: { id: '$id:number' },
            },
            createVisit: {
                operation: 'createObject',
                collection: 'visits',
            },
            countVisits: {
                operation: 'countObjects',
                collection: 'visits',
                args: {
                    url: '$url:string',
                },
            },
            findLatestVisitByUrl: {
                operation: 'findObjects',
                collection: 'visits',
                args: [
                    { url: '$url:string' },
                    { order: [['time', 'desc']], limit: 1 },
                ],
            },
            findOldestVisitByUrl: {
                operation: 'findObjects',
                collection: 'visits',
                args: [
                    { url: '$url:string' },
                    { order: [['time', 'asc']], limit: 1 },
                ],
            },
            findVisitsByUrl: {
                operation: 'findObjects',
                collection: 'visits',
                args: {
                    url: '$url:string',
                },
            },
            createFavIcon: {
                operation: 'createObject',
                collection: 'favIcons',
            },
            countFavIconByHostname: {
                operation: 'countObjects',
                collection: 'favIcons',
                args: {
                    hostname: '$hostname:string',
                },
            },
            updateFavIcon: {
                operation: 'updateObject',
                collection: 'favIcons',
                args: [
                    { hostname: '$hostname:string' },
                    { favIcon: '$favIcon' },
                ],
            },
            countBookmarksByUrl: {
                operation: 'countObjects',
                collection: 'bookmarks',
                args: {
                    url: '$url:string',
                },
            },
            findBookmarkByUrl: {
                operation: 'findObject',
                collection: 'bookmarks',
                args: { url: '$url:string' },
            },
            findLocatorsByNormalizedUrl: {
                operation: 'findObjects',
                collection: 'locators',
                args: {
                    normalizedUrl: '$normalizedUrl:string',
                },
            },
            findLocatorsByFingerprint: {
                operation: 'findObjects',
                collection: 'locators',
                args: {
                    fingerprint: '$fingerprint:string',
                },
            },
            createLocator: {
                operation: 'createObject',
                collection: 'locators',
            },
            updateLocatorStatus: {
                operation: 'updateObjects',
                collection: 'locators',
                args: [
                    {
                        normalizedUrl: '$normalizedUrl:string',
                        locationScheme: '$locationScheme:string',
                    },
                    { status: '$status:string' },
                ],
            },
        },
    })

    async createPageIfNotExists(pageData: PipelineRes): Promise<void> {
        const normalizedUrl = normalizeUrl(pageData.url)
        const exists = await this.pageExists(normalizedUrl)

        if (!exists) {
            return this.createPage(pageData)
        }
    }

    async createPage(
        pageData: PipelineRes,
        pageContentInfo?: any,
        userId?: Promise<AuthenticatedUser> | string | null,
    ) {
        const normalizedUrl = normalizeUrl(pageData.url)

        await this.operation('createPage', {
            ...pageData,
            url: normalizedUrl,
        })

        if (
            await isPkmSyncEnabled({ storageAPI: this.options.___storageAPI })
        ) {
            try {
                let dataToSave
                // if pdfs
                if (pageData.fullUrl.startsWith('https://memex.cloud')) {
                    const urlToSync =
                        pageContentInfo[pageData.url]?.locators[0]
                            .originalLocation
                    dataToSave = {
                        pageUrl: urlToSync,
                        pageTitle: pageData.fullTitle,
                        createdWhen: Date.now(),
                        pkmSyncType: 'page',
                    }
                } else {
                    dataToSave = {
                        pageUrl: pageData.fullUrl,
                        pageTitle: pageData.fullTitle,
                        createdWhen: Date.now(),
                        pkmSyncType: 'page',
                        contentText: pageData.htmlBody,
                    }
                }

                sharePageWithPKM(dataToSave, this.options.pkmSyncBG)
            } catch (e) {
                console.error(e)
            }
        }
    }

    async updatePage(newPageData: PipelineRes, existingPage: PipelineRes) {
        newPageData = { ...newPageData }

        const updates = {}

        for (const fieldName of Object.keys(newPageData)) {
            const termsField = getTermsField('pages', fieldName)

            if (termsField) {
                if (
                    !newPageData[fieldName] ||
                    existingPage[fieldName] === newPageData[fieldName]
                ) {
                    delete newPageData[fieldName]
                    continue
                }

                const mergedTerms = mergeTermFields(
                    termsField,
                    newPageData,
                    existingPage,
                )
                updates[fieldName] = newPageData[fieldName]
                updates[termsField] = mergedTerms
            } else if (
                typeof existingPage[fieldName] === 'string' ||
                typeof newPageData[fieldName] === 'string'
            ) {
                if (newPageData[fieldName] !== existingPage[fieldName]) {
                    updates[fieldName] = newPageData[fieldName]
                }
            } else if (fieldName in PAGE_COLLECTION_DEFINITIONS.pages.fields) {
                updates[fieldName] = newPageData[fieldName]
            }
        }

        if (Object.keys(updates).length) {
            await this.operation('updatePage', {
                url: normalizeUrl(newPageData.url),
                updates,
            })
        }
    }

    async createVisitsIfNeeded(url: string, visitTimes: number[]) {
        interface Visit {
            url: string
            time: number
        }
        const normalizedUrl = normalizeUrl(url)
        const newVisits: Visit[] = []
        for (const visitTime of visitTimes) {
            newVisits.push({ url: normalizedUrl, time: visitTime })
        }
        for (const visit of newVisits) {
            await this.operation('createVisit', visit)
        }
    }

    async pageExists(url: string): Promise<boolean> {
        const normalizedUrl = normalizeUrl(url)
        const existingPage = await this.operation('findPageByUrl', {
            url: normalizedUrl,
        })

        return !!existingPage
    }

    async pageHasVisits(url: string): Promise<boolean> {
        const normalizedUrl = normalizeUrl(url)
        const visitCount = await this.operation('countVisits', {
            url: normalizedUrl,
        })
        return visitCount > 0
    }

    async addPageVisit(url: string, time: number) {
        const normalizedUrl = normalizeUrl(url)
        await this.operation('createVisit', { url: normalizedUrl, time })
    }

    async addPageVisitIfHasNone(url: string, time: number) {
        const hasVisits = await this.pageHasVisits(url)

        if (!hasVisits) {
            await this.addPageVisit(url, time)
        }
    }

    async getPage(url: string): Promise<PipelineRes | null> {
        const normalizedUrl = normalizeUrl(url)
        return this.operation('findPageByUrl', { url: normalizedUrl })
    }

    async updateVisitMetadata(
        visit: { url: string; time: number },
        data: Partial<VisitInteraction>,
    ) {
        const normalizedUrl = normalizeUrl(visit.url, {})

        return this.options.storageManager
            .collection('visits')
            .updateObjects({ time: visit.time, url: normalizedUrl }, data)
            .catch(initErrHandler())
    }

    private async updatePageEntities(
        normalizedPageUrl: string,
        incomingEntities: Omit<PageEntity, 'normalizedPageUrl'>[],
    ): Promise<void> {
        const existingEntities = await this.getPageEntities(normalizedPageUrl)
        const existingIds = new Set(existingEntities.map((e) => e.id))
        const incomingIds = new Set(incomingEntities.map((e) => e.id))
        const toAdd = incomingEntities.filter((e) => !existingIds.has(e.id))
        const toUpdate = incomingEntities.filter((e) => existingIds.has(e.id))
        const toDelete = existingEntities.filter((e) => !incomingIds.has(e.id))

        for (const entity of toAdd) {
            await this.operation('createPageEntity', {
                ...entity,
                normalizedPageUrl,
            })
        }
        for (const entity of toDelete) {
            await this.operation('deletePageEntity', entity)
        }
        for (const incomingEntity of toUpdate) {
            const existing = existingEntities.find(
                (e) => e.id === incomingEntity.id,
            )
            // Skip update if nothing changed
            if (
                existing.name === incomingEntity.name.trim() &&
                existing.additionalName ===
                    incomingEntity.additionalName?.trim() &&
                existing.isPrimary === incomingEntity.isPrimary
            ) {
                continue
            }
            await this.operation('updatePageEntity', {
                id: incomingEntity.id,
                name: incomingEntity.name.trim(),
                isPrimary: incomingEntity.isPrimary,
                additionalName: incomingEntity.additionalName?.trim(),
            })
        }
    }

    async getPageMetadata(
        normalizedPageUrl: string,
    ): Promise<PageMetadata | null> {
        const existing: PageMetadata | null = await this.operation(
            'findPageMetadata',
            { normalizedPageUrl },
        )
        return existing
    }

    async getPageEntities(normalizedPageUrl: string): Promise<PageEntity[]> {
        const existingEntities: PageEntity[] = await this.operation(
            'findPageEntitiesByUrl',
            { normalizedPageUrl },
        )
        return existingEntities
    }

    async setEntityOrder(id: number, order: number): Promise<void> {
        await this.operation('updatePageEntityOrder', { id, order })
    }

    async updatePageMetadata({
        normalizedPageUrl,
        accessDate = Date.now(),
        entities,
        ...metadata
    }: PageMetadataUpdateArgs): Promise<void> {
        const nextMetadata: PageMetadata = {
            accessDate,
            normalizedPageUrl,
            doi: metadata.doi?.trim(),
            title: metadata.title?.trim(),
            releaseDate: metadata.releaseDate,
            annotation: metadata.annotation?.trim(),
            sourceName: metadata.sourceName?.trim(),
            description: metadata.description?.trim(),
            journalName: metadata.journalName?.trim(),
            journalPage: metadata.journalPage?.trim(),
            journalVolume: metadata.journalVolume?.trim(),
            previewImageUrl: metadata.previewImageUrl?.trim(),
            journalIssue: metadata.journalIssue,
        }

        const existing = await this.getPageMetadata(normalizedPageUrl)
        if (!existing) {
            await this.operation('createPageMetadata', nextMetadata)
        } else {
            await this.operation('updatePageMetadata', nextMetadata)
        }
        await this.updatePageEntities(normalizedPageUrl, entities)
    }

    async createFavIconIfNeeded(hostname: string, favIcon: string | Blob) {
        const exists = !!(await this.operation('countFavIconByHostname', {
            hostname,
        }))
        if (!exists) {
            await this.operation('createFavIcon', {
                hostname,
                favIcon: await this._maybeDecodeBlob(favIcon),
            })
        }

        return { created: !exists }
    }

    async createOrUpdateFavIcon(hostname: string, favIcon: string | Blob) {
        const { created } = await this.createFavIconIfNeeded(hostname, favIcon)
        if (!created) {
            await this.operation('updateFavIcon', {
                hostname,
                favIcon: await this._maybeDecodeBlob(favIcon),
            })
        }
    }

    async deletePageIfOrphaned(url: string) {
        const normalizedUrl = normalizeUrl(url)
        const visitCount = await this.operation('countVisits', {
            url: normalizedUrl,
        })
        if (visitCount > 0) {
            return
        }
        if (
            await this.operation('countBookmarksByUrl', { url: normalizeUrl })
        ) {
            return
        }

        await this.operation('deletePage', {
            url: normalizedUrl,
        })
    }

    async getFirstVisitOrBookmarkTime(
        normalizedPageUrl: string,
    ): Promise<number | null> {
        const [visit]: Visit[] = await this.operation('findOldestVisitByUrl', {
            url: normalizedPageUrl,
        })
        const bookmark: Bookmark = await this.operation('findBookmarkByUrl', {
            url: normalizedPageUrl,
        })
        if (!visit && !bookmark) {
            return null
        }
        return Math.min(
            ...[bookmark?.time, visit?.time].filter((t) => t != null),
        )
    }

    async getLatestVisit(
        url: string,
    ): Promise<{ url: string; time: number } | null> {
        const normalizedUrl = normalizeUrl(url)
        const result = await this.operation('findLatestVisitByUrl', {
            url: normalizedUrl,
        })
        return result.length ? result[0] : null
    }

    async getContentIdentifier(params: {
        fingerprints: Array<ContentFingerprint>
    }): Promise<{
        identifier: ContentIdentifier
        locators: ContentLocator[]
    } | null> {
        const locators: Array<ContentLocator> = flatten(
            await Promise.all(
                params.fingerprints.map((fingerprint) =>
                    this.operation('findLocatorsByFingerprint', {
                        fingerprint,
                    }),
                ),
            ),
        )
        const locator = locators.find(
            (existingLocator) =>
                !!params.fingerprints.find((fingerprint) =>
                    fingerprintsEqual(
                        {
                            fingerprintScheme: fingerprint.fingerprintScheme,
                            fingerprint: fingerprint.fingerprint,
                        },
                        existingLocator,
                    ),
                ),
        )
        if (!locator) {
            return null
        }
        const page = await this.getPage(locator.normalizedUrl)
        if (!page) {
            return null
        }
        return {
            locators,
            identifier: {
                normalizedUrl: page.url,
                fullUrl: page.fullUrl,
            },
        }
    }

    async findLocatorsByNormalizedUrl(
        normalizedUrl: string,
    ): Promise<ContentLocator[]> {
        return this.operation('findLocatorsByNormalizedUrl', {
            normalizedUrl,
        })
    }

    async storeLocators(params: {
        identifier: ContentIdentifier
        locators: ContentLocator[]
    }) {
        const existingLocators: Array<ContentLocator> = await this.operation(
            'findLocatorsByNormalizedUrl',
            params.identifier,
        )
        const toStore = params.locators.filter((locator) => {
            return (
                !isTempPdfAccessUrl(locator.originalLocation) &&
                !existingLocators.find(
                    (existing) =>
                        fingerprintsEqual(existing, locator) &&
                        existing.originalLocation === locator.originalLocation,
                )
            )
        })
        await Promise.all(
            toStore.map((locator) => this.operation('createLocator', locator)),
        )
    }

    async updateLocatorStatus(params: {
        normalizedUrl: string
        locationScheme: LocationSchemeType
        status: string
    }) {
        await this.operation('updateLocatorStatus', params)
    }

    async _maybeDecodeBlob(
        blobOrString: Blob | string,
    ): Promise<Blob | string> {
        if (this.disableBlobProcessing) {
            return blobOrString
        }

        return typeof blobOrString === 'string'
            ? decodeBlob(blobOrString)
            : blobOrString
    }
}
