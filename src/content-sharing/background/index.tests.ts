import expect from 'expect'
import { BackgroundIntegrationTestSetup } from 'src/tests/integration-tests'
import { PageDoc } from 'src/search'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import orderBy from 'lodash/orderBy'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { CreateAnnotationParams } from 'src/annotations/background/types'

export class SharingTestHelper {
    counts = { lists: 0, annotations: 0, pages: 0 }
    lists: {
        [id: number]: {
            localId: number
            remoteId?: number | string
            name: string
        }
    } = {}
    pages: {
        [id: number]: { normalizedUrl: string; fullUrl: string; title: string }
    } = {}
    entries: {
        [listId: number]: { [pageId: number]: { createdWhen: number } }
    } = {}
    annotations: {
        [id: number]: {
            pageId: number
            localId: string
            remoteId?: number | string
            privacyLevel: AnnotationPrivacyLevels
            body: string
            comment: string
            descriptorContent: { count: number }
            descriptorStrategy: string
            selectorQuote: string
            selector: CreateAnnotationParams['selector']
        }
    } = {}

    async createList(
        setup: BackgroundIntegrationTestSetup,
        options: { id: number; share?: boolean },
    ) {
        const name = `list ${++this.counts.lists}`
        const localId = await setup.backgroundModules.customLists.createCustomList(
            {
                name,
            },
        )
        this.lists[options.id] = { localId, name }
        this.entries[options.id] = {}
        if (options.share) {
            await this.shareList(setup, options)
        }
    }

    async editListTitle(
        setup: BackgroundIntegrationTestSetup,
        options: { id: number; title: string },
    ) {
        await setup.backgroundModules.customLists.updateList({
            id: this.lists[options.id].localId,
            oldName: this.lists[options.id].name,
            newName: options.title,
        })
        this.lists[options.id].name = options.title
    }

    async updateListData(
        setup: BackgroundIntegrationTestSetup,
        options: { id: number; updates: { [field: string]: any } },
    ) {
        await setup.storageManager.operation(
            'updateObject',
            'customLists',
            { id: this.lists[options.id].localId },
            options.updates,
        )
    }

    async shareList(
        setup: BackgroundIntegrationTestSetup,
        options: { id: number },
    ) {
        const {
            remoteListId,
        } = await setup.backgroundModules.contentSharing.shareList({
            listId: this.lists[options.id].localId,
        })
        expect(remoteListId).toBeDefined()
        this.lists[options.id].remoteId = remoteListId
    }

    async createPage(
        setup: BackgroundIntegrationTestSetup,
        options: { id: number; listId?: number; listIds?: number[] },
    ) {
        const count = ++this.counts.pages
        const normalizedUrl = `memex.garden/test/page-${count}`
        const fullUrl = `https://${normalizedUrl}`
        const title = `Test page ${count}`
        await setup.backgroundModules.pages.addPage({
            pageDoc: {
                url: fullUrl,
                content: { title },
            },
            visits: [],
            rejectNoContent: false,
        })
        this.pages[options.id] = {
            normalizedUrl,
            fullUrl,
            title,
        }
        if (options.listId || options.listIds) {
            for (const listId of options.listIds ?? [options.listId]) {
                await this.addPageToList(setup, {
                    pageId: options.id,
                    listId,
                })
            }
        }
    }

    async addPageToList(
        setup: BackgroundIntegrationTestSetup,
        options: { pageId: number; listId: number },
    ) {
        const {
            object,
        } = await setup.backgroundModules.customLists.insertPageToList({
            id: this.lists[options.listId].localId,
            url: this.pages[options.pageId].fullUrl,
            skipPageIndexing: true,
            suppressVisitCreation: true,
        })
        this.entries[options.listId][options.pageId] = {
            createdWhen: object.createdAt.getTime(),
        }
    }

    async removePageFromList(
        setup: BackgroundIntegrationTestSetup,
        options: { pageId: number; listId: number },
    ) {
        await setup.backgroundModules.customLists.removePageFromList({
            id: this.lists[options.listId].localId,
            url: this.pages[options.pageId].fullUrl,
        })
        delete this.entries[options.listId][options.pageId]
    }

    async createAnnotation(
        setup: BackgroundIntegrationTestSetup,
        options: { id: number; pageId: number },
    ) {
        const count = ++this.counts.annotations
        const body = `Annot body ${count}`
        const comment = `Annot comment ${count}`
        const descriptorContent = { count }
        const descriptorStrategy = `Strategy ${count}`
        const selectorQuote = `Quote ${count}`
        const selector = {
            descriptor: {
                content: [descriptorContent],
                strategy: descriptorStrategy,
            },
            quote: selectorQuote,
        }
        const localId = await setup.backgroundModules.directLinking.createAnnotation(
            {} as any,
            {
                pageUrl: this.pages[options.pageId].fullUrl,
                title: this.pages[options.pageId].title,
                body,
                comment,
                selector: selector,
            },
            { skipPageIndexing: true },
        )
        this.annotations[options.id] = {
            localId,
            pageId: options.pageId,
            privacyLevel: AnnotationPrivacyLevels.PRIVATE,
            body,
            comment,
            descriptorContent,
            descriptorStrategy,
            selectorQuote,
            selector,
        }
    }

    async editAnnotationComment(
        setup: BackgroundIntegrationTestSetup,
        options: { id: number; comment: string },
    ) {
        await setup.backgroundModules.directLinking.editAnnotation(
            null,
            this.annotations[options.id].localId,
            options.comment,
        )
        this.annotations[options.id].comment = options.comment
    }

    async deleteAnnotation(
        setup: BackgroundIntegrationTestSetup,
        options: { id: number },
    ) {
        await setup.backgroundModules.directLinking.deleteAnnotation(
            null,
            this.annotations[options.id].localId,
        )
        delete this.annotations[options.id]
    }

    async setAnnotationPrivacyLevel(
        setup: BackgroundIntegrationTestSetup,
        options: { id: number; level: AnnotationPrivacyLevels },
    ) {
        await setup.backgroundModules.contentSharing.setAnnotationPrivacyLevel({
            annotation: this.annotations[options.id].localId,
            privacyLevel: options.level,
        })
    }

    async shareAnnotation(
        setup: BackgroundIntegrationTestSetup,
        options: { id: number; shareToLists?: boolean },
    ) {
        const localId = this.annotations[options.id].localId
        await setup.backgroundModules.contentSharing.shareAnnotation({
            annotationUrl: localId,
            shareToLists: options.shareToLists,
        })
        const remoteIds = await setup.backgroundModules.contentSharing.storage.getRemoteAnnotationIds(
            {
                localIds: [localId],
            },
        )
        this.annotations[options.id].remoteId = remoteIds[localId]
    }

    async shareAnnotations(
        setup: BackgroundIntegrationTestSetup,
        options: {
            annotations: Array<{ id: number; expectNotShared?: boolean }>
        },
    ) {
        await setup.backgroundModules.contentSharing.shareAnnotations({
            annotationUrls: options.annotations.map(
                (annot) => this.annotations[annot.id].localId,
            ),
        })
        const remoteIds = await setup.backgroundModules.contentSharing.storage.getRemoteAnnotationIds(
            {
                localIds: options.annotations.map(
                    ({ id }) => this.annotations[id].localId,
                ),
            },
        )
        for (const annotation of options.annotations) {
            const remoteId = remoteIds[this.annotations[annotation.id].localId]
            this.annotations[annotation.id].remoteId = remoteId
        }
    }

    async shareAnnotationsToLists(
        setup: BackgroundIntegrationTestSetup,
        options: { ids: number[] },
    ) {
        await setup.backgroundModules.contentSharing.shareAnnotationsToLists({
            annotationUrls: options.ids.map(
                (id) => this.annotations[id].localId,
            ),
        })
    }

    async unshareAnnotationsFromLists(
        setup: BackgroundIntegrationTestSetup,
        options: { ids: number[] },
    ) {
        await setup.backgroundModules.contentSharing.unshareAnnotationsFromLists(
            {
                annotationUrls: options.ids.map(
                    (id) => this.annotations[id].localId,
                ),
            },
        )
    }

    async assertSharedLists(
        setup: BackgroundIntegrationTestSetup,
        options: { ids: number[] },
    ) {
        const ordered = await this._getStorage(
            setup,
            'shared',
            'sharedList',
            'createdWhen',
        )
        expect(ordered).toEqual(
            options.ids.map((listId) => ({
                id: convertRemoteId(this.lists[listId].remoteId),
                creator: TEST_USER.id,
                createdWhen: expect.any(Number),
                updatedWhen: expect.any(Number),
                title: this.lists[listId].name,
                description: null,
            })),
        )
    }

    async assertSharedListEntries(
        setup: BackgroundIntegrationTestSetup,
        entries: Array<{ listId: number; pageId: number }>,
    ) {
        const ordered = await this._getStorage(
            setup,
            'shared',
            'sharedListEntry',
            'createdWhen',
        )
        expect(ordered).toEqual(
            entries.map((entry) => ({
                id: expect.anything(),
                creator: TEST_USER.id,
                sharedList: convertRemoteId(this.lists[entry.listId].remoteId),
                createdWhen: this.entries[entry.listId][entry.pageId]
                    .createdWhen,
                updatedWhen: this.entries[entry.listId][entry.pageId]
                    .createdWhen,
                originalUrl: this.pages[entry.pageId].fullUrl,
                normalizedUrl: this.pages[entry.pageId].normalizedUrl,
                entryTitle: this.pages[entry.pageId].title,
            })),
        )
    }

    async assertSharedListMetadata(
        setup: BackgroundIntegrationTestSetup,
        options: { ids: number[] },
    ) {
        const ordered = await this._getStorage(
            setup,
            'local',
            'sharedListMetadata',
            'localId',
        )
        expect(ordered).toEqual(
            options.ids.map((id) => ({
                localId: this.lists[id].localId,
                remoteId: this.lists[id].remoteId,
            })),
        )
    }

    async assertSharedAnnotations(
        setup: BackgroundIntegrationTestSetup,
        options: { ids: number[] },
    ) {
        const ordered = await this._getStorage(
            setup,
            'shared',
            'sharedAnnotation',
            'createdWhen',
        )
        expect(ordered).toEqual(
            options.ids.map((id) => ({
                id: convertRemoteId(this.annotations[id].remoteId),
                creator: TEST_USER.id,
                normalizedPageUrl: this.pages[this.annotations[id].pageId]
                    .normalizedUrl,
                createdWhen: expect.any(Number),
                uploadedWhen: expect.any(Number),
                updatedWhen: expect.any(Number),
                comment: this.annotations[id].comment,
                body: this.annotations[id].body,
                selector: JSON.stringify(this.annotations[id].selector),
            })),
        )
    }

    async assertSharedAnnotationMetadata(
        setup: BackgroundIntegrationTestSetup,
        options: {
            metadata: Array<{ annotationId: number; excludeFromLists: boolean }>
        },
    ) {
        const ordered = await this._getStorage(
            setup,
            'local',
            'sharedAnnotationMetadata',
            'localId',
        )
        expect(ordered).toEqual(
            options.metadata.map((data) => ({
                localId: this.annotations[data.annotationId].localId,
                remoteId: this.annotations[data.annotationId].remoteId,
                excludeFromLists: data.excludeFromLists,
            })),
        )
    }

    async assertSharedAnnotationEntries(
        setup: BackgroundIntegrationTestSetup,
        entries: Array<{ annotationId: number; listId: number }>,
    ) {
        const ordered = await this._getStorage(
            setup,
            'shared',
            'sharedAnnotationListEntry',
            'createdWhen',
        )
        expect(ordered).toEqual(
            entries.map((entry) => ({
                id: expect.anything(),
                creator: TEST_USER.id,
                normalizedPageUrl: this.pages[
                    this.annotations[entry.annotationId].pageId
                ].normalizedUrl,
                createdWhen: expect.any(Number),
                uploadedWhen: expect.any(Number),
                updatedWhen: expect.any(Number),
                sharedList: expect.any(Number),
                sharedAnnotation: convertRemoteId(
                    this.annotations[entry.annotationId].remoteId,
                ),
            })),
        )
    }

    async assertAnnotationPrivacyLevels(
        setup: BackgroundIntegrationTestSetup,
        levels: Array<{
            annotationId: number
            level: AnnotationPrivacyLevels
            updated?: true
        }>,
    ) {
        const ordered = await this._getStorage(
            setup,
            'local',
            'annotationPrivacyLevels',
            'createdWhen',
        )
        expect(ordered).toEqual(
            levels.map((level) => ({
                id: expect.anything(),
                createdWhen: expect.any(Date),
                updatedWhen: level.updated && expect.any(Date),
                annotation: this.annotations[level.annotationId].localId,
                privacyLevel: level.level,
            })),
        )
    }

    async assertSharedPageInfo(
        setup: BackgroundIntegrationTestSetup,
        options: { pageIds: number[] },
    ) {
        const ordered = await this._getStorage(
            setup,
            'shared',
            'sharedPageInfo',
            'createdWhen',
        )
        expect(ordered).toEqual(
            options.pageIds.map((pageId) => ({
                id: expect.anything(),
                createdWhen: expect.any(Number),
                updatedWhen: expect.any(Number),
                creator: TEST_USER.id,
                fullTitle: this.pages[pageId].title,
                normalizedUrl: this.pages[pageId].normalizedUrl,
                originalUrl: this.pages[pageId].fullUrl,
            })),
        )
    }

    async _getStorage(
        setup: BackgroundIntegrationTestSetup,
        db: 'local' | 'shared',
        collection: string,
        sortField: string,
    ) {
        await setup.backgroundModules.personalCloud.waitForSync()
        const serverStorage = await setup.getServerStorage()
        const { storageManager } = db === 'local' ? setup : serverStorage
        const objects = await storageManager.operation(
            'findObjects',
            collection,
            {},
        )
        const ordered = orderBy(objects, [sortField], ['asc'])
        return ordered
    }
}

function convertRemoteId(id: string | number) {
    if (typeof id === 'number') {
        return id
    }
    const parsed = parseInt(id, 10)
    return !isNaN(parsed) ? parsed : id
}
