import { Tabs } from 'webextension-polyfill-ts'

import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'

describe('activity logger background tests', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should be able to track existing tabs', async ({ device }) => {
        const { browserAPIs } = device
        const { tabManagement } = device.backgroundModules

        const mockTabs = [
            { id: 0, url: 'https://test.com', status: 'complete' },
            { id: 1, url: 'chrome://extensions', status: 'loading' },
            { id: 2, url: 'https://test.com/1', status: 'complete' },
            { id: 3, url: 'https://test.com/2', status: 'loading' },
            { id: 4, url: 'https://test.com/3', status: 'complete' },
            { id: 5, url: 'https://worldbrain.io', status: 'complete' },
        ] as Tabs.Tab[]

        // Mock out tabs API, so it sets something we can check (TODO: afford this functionality in the setup)
        browserAPIs.tabs.query = async () => mockTabs

        const executeScriptsCalls = []

        await tabManagement.trackExistingTabs()

        expect([...tabManagement.tabManager._tabs.entries()]).toEqual(
            mockTabs.map((tab) => [
                tab.id,
                expect.objectContaining({
                    id: tab.id,
                    url: tab.url,
                    isLoaded: tab.status === 'complete',
                    isBookmarked: false,
                }),
            ]),
        )

        const expectedCalls = []
        mockTabs.forEach((tab) => {
            if (tab.id === 1) {
                return
            }

            expectedCalls.push({
                id: tab.id,
                script: { file: '/lib/browser-polyfill.js' },
            })
            expectedCalls.push({
                id: tab.id,
                script: { file: '/content_script.js' },
            })
        })
        expect(executeScriptsCalls).toEqual(
            expect.arrayContaining(expectedCalls),
        )
    })
})
