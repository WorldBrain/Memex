import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { renderTemplate } from '@worldbrain/memex-common/lib/firebase-backend/social-previews/html-template'
import { SocialPreviewHTMLRenderer } from '@worldbrain/memex-common/lib/firebase-backend/social-previews/html-renderer'
import {
    LIST_DESCRIPTION_FALLBACK,
    PAGE_DESCRIPTION_FALLBACK,
    PAGE_TITLE_FALLBACK,
} from '@worldbrain/memex-common/lib/firebase-backend/social-previews/constants'
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
import {
    createPageLinkListTitle,
    getListShareUrl,
    getNoteShareUrl,
} from 'src/content-sharing/utils'

const TEST_BUNDLES_STR = 'test-1.js test-2.js test-1.css'
const TEST_BUNDLES_ARR = TEST_BUNDLES_STR.split(' ')

async function setupTest(opts: {}) {
    let capturedError: Error | null = null
    const setup = await setupBackgroundIntegrationTest()
    const serverStorage = setup.serverStorage
    const htmlRenderer = new SocialPreviewHTMLRenderer({
        fetch: setup.fetch as any,
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
        const { storageManager, htmlRenderer, fetchMock } = await setupTest({})
        const previewImage = './some-preview-img.png'
        const previewDescription = 'some page description'
        fetchMock.mock('*', 200, {
            response: `<html><head>
            <meta property="og:image" content="${previewImage}" />
            <meta property="og:description" content="${previewDescription}" />
        </head></html>`,
        })

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
            entryTitle: 'some title',
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
            data: {
                image: previewImage,
                title: sharedListEntryData.entryTitle,
            },
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
                listEntryData: {
                    ...sharedListEntryData,
                    description: previewDescription,
                },
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

    it('should render HTML correct OG tags for annotation', async () => {
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

        const renderedHtmlA = await htmlRenderer.renderAnnotationPreview({
            annotationId: sharedAnnotationData.id,
        })

        // prettier-ignore
        {
        expect(renderedHtmlA.includes(`<meta property="twitter:image" content="${ogImgSrc}" />`)).toBe(true)
        expect(renderedHtmlA.includes(`<meta property="twitter:title" content="${sharedPageInfoData.fullTitle}" />`)).toBe(true)
        expect(renderedHtmlA.includes(`<meta property="og:image" content="${ogImgSrc}" />`)).toBe(true)
        expect(renderedHtmlA.includes(`<meta property="og:title" content="${sharedPageInfoData.fullTitle}" />`)).toBe(true)
        expect(renderedHtmlA.includes(`<meta property="og:description" content="${sharedPageInfoData.originalUrl}" />`)).toBe(true)
        expect(renderedHtmlA.includes(`<meta property="og:url" content="${getNoteShareUrl({ remoteAnnotationId: sharedAnnotationData.id.toString() })}" />`)).toBe(true)
        }
    })

    // TODO: Fix this test
    it.skip('should render HTML correct OG tags for a list', async () => {
        return
        const { storageManager, htmlRenderer } = await setupTest({})

        const now = Date.now()
        const sharedListDataA: SharedList & {
            id: AutoPk
            creator: AutoPk
        } = {
            id: 1,
            creator: 1,
            title: 'my test list A',
            description: 'great list',
            createdWhen: now,
            updatedWhen: now,
        }
        const sharedListDataB: SharedList & {
            id: AutoPk
            creator: AutoPk
        } = {
            id: 2,
            creator: 1,
            title: 'my test list B',
            description: undefined, // NOTE: No description
            createdWhen: now,
            updatedWhen: now,
        }

        for (const sharedList of [sharedListDataA, sharedListDataB]) {
            await storageManager
                .collection('sharedList')
                .createObject(sharedList)
        }

        const ogImgSrcA = generateListPreviewUrl({ list: sharedListDataA })
        const ogImgSrcB = generateListPreviewUrl({ list: sharedListDataB })
        const renderedHtmlA = await htmlRenderer.renderListPreview({
            listId: sharedListDataA.id,
        })
        const renderedHtmlB = await htmlRenderer.renderListPreview({
            listId: sharedListDataB.id,
        })

        // prettier-ignore
        {
        expect(renderedHtmlA.includes(`<meta property="twitter:image" content="${ogImgSrcA}" />`)).toBe(true)
        expect(renderedHtmlA.includes(`<meta property="twitter:title" content="${sharedListDataA.title}" />`)).toBe(true)
        expect(renderedHtmlA.includes(`<meta property="og:image" content="${ogImgSrcA}" />`)).toBe(true)
        expect(renderedHtmlA.includes(`<meta property="og:title" content="${sharedListDataA.title}" />`)).toBe(true)
        expect(renderedHtmlA.includes(`<meta property="og:description" content="${sharedListDataA.description}" />`)).toBe(true)
        expect(renderedHtmlA.includes(`<meta property="og:url" content="${getListShareUrl({ remoteListId: sharedListDataA.id.toString() })}" />`)).toBe(true)

        expect(renderedHtmlB.includes(`<meta property="twitter:image" content="${ogImgSrcB}" />`)).toBe(true)
        expect(renderedHtmlB.includes(`<meta property="twitter:title" content="${sharedListDataB.title}" />`)).toBe(true)
        expect(renderedHtmlB.includes(`<meta property="og:image" content="${ogImgSrcB}" />`)).toBe(true)
        expect(renderedHtmlB.includes(`<meta property="og:title" content="${sharedListDataB.title}" />`)).toBe(true)
        expect(renderedHtmlB.includes(`<meta property="og:description" content="${LIST_DESCRIPTION_FALLBACK}" />`)).toBe(true)
        expect(renderedHtmlB.includes(`<meta property="og:url" content="${getListShareUrl({ remoteListId: sharedListDataB.id.toString() })}" />`)).toBe(true)
        }
    })

    // TODO: Fix this test
    it.skip('should render HTML correct OG tags for a page', async () => {
        return
        const { storageManager, htmlRenderer, fetchMock } = await setupTest({})
        const previewImage = './some-preview-img.png'
        const previewDescription = 'some page description'

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
        const sharedListEntryDataA: SharedListEntry & {
            id: AutoPk
            creator: AutoPk
        } = {
            id: 1,
            creator: 1,
            normalizedUrl: 'test.com/test',
            originalUrl: 'https://test.com/test',
            entryTitle: 'test page title',
            createdWhen: now,
            updatedWhen: now,
        }
        const sharedListEntryDataB: SharedListEntry & {
            id: AutoPk
            creator: AutoPk
        } = {
            id: 2,
            creator: 1,
            normalizedUrl: 'test.com/test2',
            originalUrl: 'https://test.com/test2',
            entryTitle: undefined, // NOTE: No page title
            createdWhen: now,
            updatedWhen: now,
        }

        await storageManager
            .collection('sharedList')
            .createObject(sharedListData)
        await storageManager
            .collection('sharedListEntry')
            .createObject(sharedListEntryDataA)
        await storageManager
            .collection('sharedListEntry')
            .createObject(sharedListEntryDataB)

        const ogImgSrcA = generatePagePreviewUrl({
            data: {
                title: sharedListEntryDataA.entryTitle,
                image: previewImage,
            },
        })
        const ogImgSrcB = generatePagePreviewUrl({
            data: {
                image: previewImage,
            },
        })

        fetchMock.mock('*', 200, {
            response: `<html><head>
            <meta property="og:image" content="${previewImage}" />
            <meta property="og:description" content="${previewDescription}" />
        </head></html>`,
        })
        const renderedHtmlA = await htmlRenderer.renderPagePreview({
            listId: sharedListData.id,
            listEntryId: sharedListEntryDataA.id,
        })

        // This one responds with HTML lacking og:description data
        fetchMock.mock('*', 200, {
            overwriteRoutes: true,
            response: `<html><head>
            <meta property="og:image" content="${previewImage}" />
        </head></html>`,
        })
        const renderedHtmlB = await htmlRenderer.renderPagePreview({
            listId: sharedListData.id,
            listEntryId: sharedListEntryDataB.id,
        })

        // prettier-ignore
        {
        expect(renderedHtmlA.includes(`<meta property="twitter:image" content="${ogImgSrcA}" />`)).toBe(true)
        expect(renderedHtmlA.includes(`<meta property="twitter:title" content="${sharedListEntryDataA.entryTitle}" />`)).toBe(true)
        expect(renderedHtmlA.includes(`<meta property="og:image" content="${ogImgSrcA}" />`)).toBe(true)
        expect(renderedHtmlA.includes(`<meta property="og:title" content="${sharedListEntryDataA.entryTitle}" />`)).toBe(true)
        expect(renderedHtmlA.includes(`<meta property="og:description" content="${previewDescription}" />`)).toBe(true)
        expect(renderedHtmlA.includes(`<meta property="og:url" content="${sharedListEntryDataA.originalUrl}" />`)).toBe(true)

        expect(renderedHtmlB.includes(`<meta property="twitter:image" content="${ogImgSrcB}" />`)).toBe(true)
        expect(renderedHtmlB.includes(`<meta property="twitter:title" content="${PAGE_TITLE_FALLBACK}" />`)).toBe(true)
        expect(renderedHtmlB.includes(`<meta property="og:image" content="${ogImgSrcB}" />`)).toBe(true)
        expect(renderedHtmlB.includes(`<meta property="og:title" content="${PAGE_TITLE_FALLBACK}" />`)).toBe(true)
        expect(renderedHtmlB.includes(`<meta property="og:description" content="${PAGE_DESCRIPTION_FALLBACK}" />`)).toBe(true)
        expect(renderedHtmlB.includes(`<meta property="og:url" content="${sharedListEntryDataB.originalUrl}" />`)).toBe(true)
        }
    })
})
