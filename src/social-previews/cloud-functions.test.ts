import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { renderTemplate } from '@worldbrain/memex-common/lib/firebase-backend/social-previews/html-template'
import { SocialPreviewHTMLRenderer } from '@worldbrain/memex-common/lib/firebase-backend/social-previews/html-renderer'
import type {
    SharedAnnotation,
    SharedPageInfo,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import { generateOgImgUrl } from '@worldbrain/memex-common/lib/firebase-backend/social-previews/utils'

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

        const ogImgSrc = generateOgImgUrl({
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
})
