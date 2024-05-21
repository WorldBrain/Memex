import { Tabs } from 'webextension-polyfill'

import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'

// NOTE: Commented out as CS injection is no longer performed on tab tracking
describe('activity logger background tests', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it(
        'should be able to track existing tabs',
        async ({ device }) => {
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

            const createScriptCallObj = (tabId: number, file: string) => ({
                id: tabId,
                script: { file, runAt: 'document_idle' },
            })

            // Mock out tabs API, so it sets something we can check
            browserAPIs.tabs.query = async () => mockTabs

            const executeScriptsCalls: Array<{
                id: number
                script: { file: string }
            }> = []
            browserAPIs.tabs.executeScript = (async (tabId, script) => {
                executeScriptsCalls.push({ id: tabId!, script })
                return []
            }) as any
            await tabManagement.trackExistingTabs()

            expect([...tabManagement.tabManager._tabs.entries()]).toEqual(
                mockTabs.map((tab) => [
                    tab.id,
                    expect.objectContaining({
                        id: tab.id,
                        url: tab.url,
                        isLoaded: tab.status === 'complete',
                    }),
                ]),
            )

            const expectedCalls = []
            mockTabs.forEach((tab) => {
                if (tab.id === 1) {
                    return
                }

                expectedCalls.push(
                    createScriptCallObj(tab.id, '/lib/browser-polyfill.js'),
                    createScriptCallObj(tab.id, '/content_script.js'),
                )
            })
            expect(executeScriptsCalls).toEqual(
                expect.arrayContaining(expectedCalls),
            )
        },
        { shouldSkip: true },
    )
})
