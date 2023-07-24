import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { renderTemplate } from '@worldbrain/memex-common/lib/firebase-backend/social-previews/html-template'
import { SocialPreviewHTMLRenderer } from '@worldbrain/memex-common/lib/firebase-backend/social-previews/html-renderer'

const TEST_BUNDLES_STR = 'test-1.js test-2.js test-1.css'
const TEST_BUNDLES_ARR = TEST_BUNDLES_STR.split(' ')

async function setupTest(opts: {}) {
    const setup = await setupBackgroundIntegrationTest()
    const serverStorage = await setup.getServerStorage()
    const htmlRenderer = new SocialPreviewHTMLRenderer({
        storage: serverStorage.modules,
        getFunctionConfig: () => ({
            social_previews: { web_ui_bundles: TEST_BUNDLES_STR },
        }),
    })

    return {
        htmlRenderer,
        fetchMock: setup.fetch,
        storageManager: serverStorage.manager,
    }
}

describe('Social previews tests', () => {
    it('should generate HTML containing OG tags, web UI JS bundles, and annot data for an existing annotation', async () => {
        // TODO
        expect(1).toBe(2)
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
