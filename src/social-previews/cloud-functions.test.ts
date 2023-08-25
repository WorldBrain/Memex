import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { renderTemplate } from '@worldbrain/memex-common/lib/firebase-backend/social-previews/html-template'
import { SocialPreviewHTMLRenderer } from '@worldbrain/memex-common/lib/firebase-backend/social-previews/html-renderer'
import type {
    SharedAnnotation,
    SharedList,
    SharedListEntry,
    SharedPageInfo,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import {
    generateAnnotationPreviewUrl,
    generateListPreviewUrl,
    generatePagePreviewUrl,
} from '@worldbrain/memex-common/lib/firebase-backend/social-previews/utils'
import { createPageLinkListTitle } from 'src/content-sharing/utils'

const TEST_BUNDLES_STR = 'test-1.js test-2.js test-1.css'
const TEST_BUNDLES_ARR = TEST_BUNDLES_STR.split(' ')

async function setupTest(opts: {}) {
    let capturedError: Error | null = null
    const setup = await setupBackgroundIntegrationTest()
    const serverStorage = await setup.getServerStorage()
    const htmlRenderer = new SocialPreviewHTMLRenderer({
        storage: serverStorage.modules,
        captureException: async (err) => {
            capturedError = err
        },
        getFunctionConfig: () => ({
            social_previews: { web_ui_bundles: TEST_BUNDLES_STR },
        }),
    })

    return {
        htmlRenderer,
        capturedError,
        fetchMock: setup.fetch,
        storageManager: serverStorage.manager,
    }
}

describe('Social previews tests', () => {
    it('should generate HTML containing OG tags, web UI JS bundles, and annot data for an existing page annotation', async () => {
        const { storageManager, htmlRenderer } = await setupTest({})
        const now = Date.now()
        const sharedPageInfoData: SharedPageInfo & {
            id: AutoPk
            creator: AutoPk
        } = {
            id: 1,
            creator: 1,
            originalUrl: 'https://test.com/test',
            normalizedUrl: 'test.com/test',
            fullTitle: 'Test page title',
            createdWhen: now,
            updatedWhen: now,
        }
        const sharedAnnotationData: SharedAnnotation & {
            id: AutoPk
            creator: AutoPk
        } = {
            id: 1,
            creator: 1,
            normalizedPageUrl: sharedPageInfoData.normalizedUrl,
            comment: 'test comment',
            createdWhen: now,
            updatedWhen: now,
            uploadedWhen: now,
        }

        await storageManager
            .collection('sharedPageInfo')
            .createObject(sharedPageInfoData)
        await storageManager
            .collection('sharedAnnotation')
            .createObject(sharedAnnotationData)

        const ogImgSrc = generateAnnotationPreviewUrl({
            pageInfo: sharedPageInfoData,
            annotation: sharedAnnotationData,
        })

        expect(
            await htmlRenderer.renderAnnotationPreview({
                annotationId: sharedAnnotationData.id,
            }),
        ).toEqual(
            renderTemplate({
                ogImgSrc,
                bundleSrcs: TEST_BUNDLES_ARR,
                annotationData: sharedAnnotationData,
                pageData: {
                    ...sharedPageInfoData,
                    sourceUrl: sharedPageInfoData.originalUrl,
                },
            }),
        )
    })

    it('should generate HTML containing OG tags, web UI JS bundles, and list data for an existing list', async () => {
        const { storageManager, htmlRenderer } = await setupTest({})
        const now = Date.now()
        const sharedListData: SharedList & {
            id: AutoPk
            creator: AutoPk
        } = {
            id: 1,
            creator: 1,
            title: 'my test list',
            description: 'great list',
            createdWhen: now,
            updatedWhen: now,
        }

        await storageManager
            .collection('sharedList')
            .createObject(sharedListData)

        const ogImgSrc = generateListPreviewUrl({ list: sharedListData })

        expect(
            await htmlRenderer.renderListPreview({
                listId: sharedListData.id,
            }),
        ).toEqual(
            renderTemplate({
                ogImgSrc,
                bundleSrcs: TEST_BUNDLES_ARR,
                listData: sharedListData,
            }),
        )
    })

    it('should generate HTML containing OG tags, web UI JS bundles, and list+list entry data for an existing page link list', async () => {
        const { storageManager, htmlRenderer } = await setupTest({})
        const now = Date.now()
        const sharedListData: SharedList & {
            id: AutoPk
            creator: AutoPk
        } = {
            id: 1,
            creator: 1,
            title: createPageLinkListTitle(new Date(now)),
            type: 'page-link',
            createdWhen: now,
            updatedWhen: now,
        }
        const sharedListEntryData: SharedListEntry & {
            id: AutoPk
            creator: AutoPk
        } = {
            id: 1,
            creator: 1,
            normalizedUrl: 'test.com/test',
            originalUrl: 'https://test.com/test',
            createdWhen: now,
            updatedWhen: now,
        }

        await storageManager
            .collection('sharedList')
            .createObject(sharedListData)
        await storageManager
            .collection('sharedListEntry')
            .createObject(sharedListEntryData)

        const ogImgSrc = generatePagePreviewUrl({
            listEntry: sharedListEntryData,
        })

        expect(
            await htmlRenderer.renderPagePreview({
                listId: sharedListData.id,
                listEntryId: sharedListEntryData.id,
            }),
        ).toEqual(
            renderTemplate({
                ogImgSrc,
                bundleSrcs: TEST_BUNDLES_ARR,
                listData: sharedListData,
                listEntryData: sharedListEntryData,
            }),
        )
    })

    it('should return base HTML without OG tags and annot data when called for a non-existent annotation', async () => {
        const { storageManager, htmlRenderer } = await setupTest({})

        const annotationId = 'non-existent-annotation-id'
        expect(
            await storageManager.collection('sharedAnnotation').findObject({
                id: annotationId,
            }),
        ).toEqual(null)

        expect(
            await htmlRenderer.renderAnnotationPreview({ annotationId }),
        ).toEqual(renderTemplate({ bundleSrcs: TEST_BUNDLES_ARR }))
    })

    it('should return base HTML without OG tags and annot data when called for a non-existent list', async () => {
        const { storageManager, htmlRenderer } = await setupTest({})

        const listId = 'non-existent-list-id'
        expect(
            await storageManager.collection('sharedList').findObject({
                id: listId,
            }),
        ).toEqual(null)

        expect(await htmlRenderer.renderListPreview({ listId })).toEqual(
            renderTemplate({ bundleSrcs: TEST_BUNDLES_ARR }),
        )
    })

    it('should return base HTML without OG tags and annot data when called for a non-existent page link list+list entry', async () => {
        const { storageManager, htmlRenderer } = await setupTest({})

        const listId = 'non-existent-page-link-list-id'
        const listEntryId = 'non-existent-list-entry-id'
        expect([
            await storageManager.collection('sharedList').findObject({
                id: listId,
            }),
            await storageManager.collection('sharedListEntry').findObject({
                id: listEntryId,
            }),
        ]).toEqual([null, null])

        expect(
            await htmlRenderer.renderPagePreview({ listId, listEntryId }),
        ).toEqual(renderTemplate({ bundleSrcs: TEST_BUNDLES_ARR }))
    })
})
