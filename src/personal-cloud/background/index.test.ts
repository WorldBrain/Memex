import { setupSyncBackgroundTest } from './index.tests'
import { StorexPersonalCloudBackend } from '@worldbrain/memex-common/lib/personal-cloud/backend/storex'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { BackgroundIntegrationTestSetup } from 'src/tests/integration-tests'

describe('Personal cloud', () => {
    it('should sync full page texts indexed from tabs', async () => {
        const { setups, serverStorage, getNow } = await setupSyncBackgroundTest(
            {
                deviceCount: 2,
                useDownloadTranslationLayer: true,
            },
        )

        const fullUrl = 'http://www.thetest.com/home'
        const fullText = `the lazy fox jumped over something I can't remember!`
        const htmlBody = `<strong>${fullText}</strong>`
        setups[0].backgroundModules.tabManagement.extractRawPageContent = async () => ({
            type: 'html',
            url: fullUrl,
            body: htmlBody,
            lang: '',
            metadata: {
                title: 'The Test',
            },
        })
        setups[0].backgroundModules.tabManagement.findTabIdByFullUrl = async () =>
            667

        const test = async () => {
            await setups[0].backgroundModules.pages.indexPage({
                fullUrl,
                tabId: 667,
            })

            const expectPageContent = async (
                setup: BackgroundIntegrationTestSetup,
            ) => {
                expect(
                    await setup.persistentStorageManager
                        .collection('pageContent')
                        .findObjects({}),
                ).toEqual([
                    {
                        id: expect.any(Number),
                        normalizedUrl: 'thetest.com/home',
                        htmlBody,
                    },
                ])
                expect(
                    await setup.storageManager
                        .collection('pages')
                        .findObjects({}),
                ).toEqual([
                    expect.objectContaining({
                        text: fullText,
                        terms: ['lazy', 'fox', 'jumped', 'remember'],
                    }),
                ])
            }

            await expectPageContent(setups[0])
            await setups[0].backgroundModules.personalCloud.waitForSync()
            const firstCloudBackend = setups[0].backgroundModules.personalCloud
                .options.backend as StorexPersonalCloudBackend
            expect(firstCloudBackend.options.view.hub.storedObjects).toEqual([
                {
                    path: expect.stringMatching(
                        new RegExp(`/u/${TEST_USER.id}/htmlBody/.+\.html`),
                    ),
                    object: htmlBody,
                },
            ])

            await setups[1].backgroundModules.personalCloud.waitForSync()
            await expectPageContent(setups[1])
        }
        await test()
        await test()
    })

    it.todo('should sync full page texts indexed from URLs')
})
