import expect from 'expect'
import { BackgroundIntegrationTestSetup } from 'src/tests/integration-tests'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import orderBy from 'lodash/orderBy'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { CreateAnnotationParams } from 'src/annotations/background/types'
import { AnnotationSharingStates, AnnotationSharingState } from './types'
import fromPairs from 'lodash/fromPairs'

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

    private createAnnotationLocalIdToTestIdMap(): Map<string, number> {
        const idMap = new Map<string, number>()
        for (const [id, annotation] of Object.entries(this.annotations)) {
            idMap.set(annotation.localId, Number(id))
        }
        return idMap
    }

    async createList(
        setup: BackgroundIntegrationTestSetup,
        options: { id: number; share?: boolean },
    ) {
        const name = `list ${++this.counts.lists}`
        const {
            localListId,
            remoteListId,
        } = await setup.backgroundModules.customLists.createCustomList({
            name,
            id: Date.now(),
        })
        this.lists[options.id] = {
            name,
            localId: localListId,
            remoteId: remoteListId,
        }
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
        const localListId = this.lists[options.id].localId
        const annotationLocalToRemoteIdsDict = await setup.backgroundModules.contentSharing[
            'listSharingService'
        ].ensureRemoteAnnotationIdsExistForList(localListId)
        const {
            remoteListId,
            annotationSharingStatesPromise,
        } = await setup.backgroundModules.contentSharing[
            'listSharingService'
        ].shareList({
            localListId,
            annotationLocalToRemoteIdsDict,
        })
        expect(remoteListId).toBeDefined()
        this.lists[options.id].remoteId = remoteListId

        const idMap = this.createAnnotationLocalIdToTestIdMap()

        const annotationSharingStates = await annotationSharingStatesPromise

        for (const [localAnnotId, sharingState] of Object.entries(
            annotationSharingStates,
        )) {
            const testId = idMap.get(localAnnotId)
            if (testId == null) {
                continue
            }
            this.annotations[testId].remoteId = sharingState.remoteId
            this.annotations[testId].privacyLevel = sharingState.privacyLevel
        }
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
        options: {
            id: number
            pageId: number
        } & (
            | {
                  level: AnnotationPrivacyLevels
                  expectedSharingState: AnnotationSharingState
              }
            | {}
        ),
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
                selector,
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
        if ('level' in options) {
            await this.setAnnotationPrivacyLevel(setup, {
                id: options.id,
                level: options.level,
                expectedSharingState: options.expectedSharingState!,
            })
        }
    }

    async editAnnotationComment(
        setup: BackgroundIntegrationTestSetup,
        options: { id: number; comment: string; body: string },
    ) {
        await setup.backgroundModules.directLinking.editAnnotation(
            null,
            this.annotations[options.id].localId,
            options.comment,
            'two',
            options.body,
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
        options: {
            id: number
            keepListsIfUnsharing?: boolean
            level: AnnotationPrivacyLevels
            expectedSharingState: AnnotationSharingState
        },
    ) {
        const sharingState = await setup.backgroundModules.contentSharing.setAnnotationPrivacyLevel(
            {
                keepListsIfUnsharing: options.keepListsIfUnsharing,
                annotationUrl: this.annotations[options.id].localId,
                privacyLevel: options.level,
            },
        )
        if (sharingState.remoteId) {
            this.annotations[options.id].remoteId = sharingState.remoteId
        }
        this._expectAnnotationSharingState(
            sharingState,
            options.expectedSharingState,
        )
    }

    async shareAnnotation(
        setup: BackgroundIntegrationTestSetup,
        options: {
            id: number
            shareToParentPageLists?: boolean
            expectedSharingState: AnnotationSharingState
        },
    ) {
        const localId = this.annotations[options.id].localId
        const sharingState = await setup.backgroundModules.contentSharing.shareAnnotation(
            {
                annotationUrl: localId,
                shareToParentPageLists: options.shareToParentPageLists,
            },
        )
        const remoteIds = await setup.backgroundModules.contentSharing.storage.getRemoteAnnotationIds(
            {
                localIds: [localId],
            },
        )
        this.annotations[options.id].remoteId = remoteIds[localId]
        this._expectAnnotationSharingState(
            sharingState,
            options.expectedSharingState,
        )
    }

    async shareAnnotations(
        setup: BackgroundIntegrationTestSetup,
        annotations: Array<{ id: number; expectNotShared?: boolean }>,
        options: { expectedSharingStates: AnnotationSharingStates },
    ) {
        const {
            sharingStates,
        } = await setup.backgroundModules.contentSharing.shareAnnotations({
            annotationUrls: annotations.map(
                (annot) => this.annotations[annot.id].localId,
            ),
        })
        const remoteIds = await setup.backgroundModules.contentSharing.storage.getRemoteAnnotationIds(
            {
                localIds: annotations.map(
                    ({ id }) => this.annotations[id].localId,
                ),
            },
        )
        for (const annotation of annotations) {
            const remoteId = remoteIds[this.annotations[annotation.id].localId]
            this.annotations[annotation.id].remoteId = remoteId
        }
        this._expectAnnotationSharingStates(
            sharingStates,
            options.expectedSharingStates,
        )
    }

    async shareAnnotationsToAllLists(
        setup: BackgroundIntegrationTestSetup,
        options: {
            ids: number[]
            expectedSharingStates: AnnotationSharingStates
        },
    ) {
        const {
            sharingStates,
        } = await setup.backgroundModules.contentSharing.shareAnnotationsToAllLists(
            {
                annotationUrls: options.ids.map(
                    (id) => this.annotations[id].localId,
                ),
            },
        )
        this._expectAnnotationSharingStates(
            sharingStates,
            options.expectedSharingStates,
        )
    }

    async shareAnnotationsToSomeLists(
        setup: BackgroundIntegrationTestSetup,
        options: {
            annotationsIds: number[]
            listIds: number[]
            protectAnnotations?: boolean
            expectedSharingStates: AnnotationSharingStates
            createdPageListEntries?: Array<{ pageId: number; listId: number }>
        },
    ) {
        const sharingStates: AnnotationSharingStates = {}
        for (const annotationId of options.annotationsIds) {
            const {
                sharingState,
            } = await setup.backgroundModules.contentSharing.shareAnnotationToSomeLists(
                {
                    annotationUrl: this.annotations[annotationId].localId,
                    protectAnnotation: options.protectAnnotations,
                    localListIds: options.listIds.map(
                        (id) => this.lists[id].localId,
                    ),
                },
            )
            sharingStates[this.annotations[annotationId].localId] = sharingState
            this.annotations[annotationId].remoteId = sharingState.remoteId
        }
        for (const entry of options.createdPageListEntries ?? []) {
            const pageUrl = this.pages[entry.pageId].normalizedUrl
            const listEntries = await setup.backgroundModules.customLists.storage.fetchListPagesById(
                {
                    listId: this.lists[entry.listId].localId,
                },
            )
            const listEntry = listEntries.find(
                (entryInList) => entryInList.pageUrl === pageUrl,
            )
            if (!listEntry) {
                throw new Error(
                    `Expected list entry to be created, but found none: ${JSON.stringify(
                        entry,
                    )}`,
                )
            }
            this.entries[entry.listId][entry.pageId] = {
                createdWhen: listEntry.createdAt.getTime(),
            }
        }

        this._expectAnnotationSharingStates(
            sharingStates,
            options.expectedSharingStates,
        )
    }

    async unshareAnnotationsFromAllLists(
        setup: BackgroundIntegrationTestSetup,
        options: {
            ids: number[]
            expectedSharingStates: AnnotationSharingStates
        },
    ) {
        const {
            sharingStates,
        } = await setup.backgroundModules.contentSharing.unshareAnnotationsFromAllLists(
            {
                annotationUrls: options.ids.map(
                    (id) => this.annotations[id].localId,
                ),
            },
        )
        this._expectAnnotationSharingStates(
            sharingStates,
            options.expectedSharingStates,
        )
    }

    async unshareAnnotationsFromList(
        setup: BackgroundIntegrationTestSetup,
        options: {
            annotationsIds: number[]
            listId: number
            expectedSharingStates: AnnotationSharingStates
        },
    ) {
        const sharingStates: AnnotationSharingStates = {}
        for (const annotationId of options.annotationsIds) {
            const {
                sharingState,
            } = await setup.backgroundModules.contentSharing.unshareAnnotationFromList(
                {
                    annotationUrl: this.annotations[annotationId].localId,
                    localListId: this.lists[options.listId].localId,
                },
            )
            sharingStates[this.annotations[annotationId].localId] = sharingState
        }
        this._expectAnnotationSharingStates(
            sharingStates,
            options.expectedSharingStates,
        )
    }

    async unshareAnnotations(
        setup: BackgroundIntegrationTestSetup,
        options: {
            ids: number[]
            expectedSharingStates: AnnotationSharingStates
        },
    ) {
        const {
            sharingStates,
        } = await setup.backgroundModules.contentSharing.unshareAnnotations({
            annotationUrls: options.ids.map(
                (id) => this.annotations[id].localId,
            ),
        })
        this._expectAnnotationSharingStates(
            sharingStates,
            options.expectedSharingStates,
        )
    }

    async unshareAnnotation(
        setup: BackgroundIntegrationTestSetup,
        options: { id: number; expectedSharingState: AnnotationSharingState },
    ) {
        const {
            sharingState,
        } = await setup.backgroundModules.contentSharing.unshareAnnotation({
            annotationUrl: this.annotations[options.id].localId,
        })
        this._expectAnnotationSharingState(
            sharingState,
            options.expectedSharingState,
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
                private: true,
                description: null,
                type: null,
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
                createdWhen:
                    this.entries[entry.listId][entry.pageId]?.createdWhen ??
                    expect.any(Number),
                updatedWhen:
                    this.entries[entry.listId][entry.pageId]?.createdWhen ??
                    expect.any(Number),
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
                private: true,
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
                color: null,
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

    async assertSharedAnnotationListEntries(
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

    async assertPageListEntries(
        setup: BackgroundIntegrationTestSetup,
        entries: Array<{
            pageId: number
            listId: number
        }>,
    ) {
        const ordered = await this._getStorage(
            setup,
            'local',
            'pageListEntries',
            'createdAt',
        )
        expect(ordered).toEqual(
            entries.map((entry) => ({
                createdAt: expect.any(Date),
                listId: this.lists[entry.listId].localId,
                pageUrl: this.pages[entry.pageId].normalizedUrl,
                fullUrl: this.pages[entry.pageId].fullUrl,
            })),
        )
    }

    async assertAnnotationListEntries(
        setup: BackgroundIntegrationTestSetup,
        entries: Array<{
            annotationId: number
            listId: number
        }>,
    ) {
        const ordered = await this._getStorage(
            setup,
            'local',
            'annotListEntries',
            'createdAt',
        )
        expect(ordered).toEqual(
            entries.map((entry) => ({
                createdAt: expect.any(Date),
                listId: this.lists[entry.listId].localId,
                url: this.annotations[entry.annotationId].localId,
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
        const serverStorage = setup.serverStorage
        const storageManager =
            db === 'local' ? setup.storageManager : serverStorage.manager
        const objects = await storageManager.operation(
            'findObjects',
            collection,
            {},
        )
        const ordered = orderBy(objects, [sortField], ['asc'])
        return ordered
    }

    _prepareAnnotationStateForExpect(state: AnnotationSharingState) {
        state.privateListIds = state.privateListIds.map(
            (id) => this.lists[id].localId as any,
        )
        state.sharedListIds = state.sharedListIds.map(
            (id) => this.lists[id].localId as any,
        )
        if (state.hasLink) {
            state.remoteId = expect.any(String) as any
        }
        return state
    }

    _expectAnnotationSharingState(
        actual: AnnotationSharingState,
        expected: AnnotationSharingState,
    ) {
        this._prepareAnnotationStateForExpect(expected)
        expect(actual).toEqual(expected)
    }

    _expectAnnotationSharingStates(
        actual: AnnotationSharingStates,
        expected: AnnotationSharingStates,
    ) {
        expect(actual).toEqual(
            fromPairs(
                Object.entries(expected).map(([annotationId, state]) => [
                    this.annotations[annotationId].localId,
                    this._prepareAnnotationStateForExpect(state),
                ]),
            ),
        )
    }
}

function convertRemoteId(id: string | number) {
    if (typeof id === 'number') {
        return id
    }
    const parsed = parseInt(id, 10)
    return !isNaN(parsed) ? parsed : id
}
