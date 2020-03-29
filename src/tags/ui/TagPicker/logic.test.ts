import { setupUiLogicTest } from 'src/util/ui-logic'
import TagPickerLogic, { INITIAL_STATE, TagPickerEvent } from './logic'
import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'

// see https://github.com/WorldBrain/Memex-Mobile/blob/develop/app/src/features/overview/ui/screens/dashboard/logic.test.ts
// see https://github.com/WorldBrain/Memex-Mobile/blob/7b74b83d3f3ebec793317c84222939d3fcba67b7/app/src/ui/index.tests.ts#L3

describe('TagPickerLogic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should correctly load initial tags', async ({ device }) => {
        const element = device.createElement(
            new TagPickerLogic({
                onUpdateTagSelection: () => {},
                queryTags: async (query: string) => [],
                loadDefaultSuggestions: () => ['bla', 'why?'],
                url: '',
                initialSelectedTags: async () => [],
            }),
        )

        await element.init()

        expect(element.state).toEqual({
            loadingQueryResults: false,
            loadingSuggestions: false,
            query: '',
            displayTags: [],
            selectedTags: [],
            suggestions: [],
        })
    })

    it('should correctly load initial tags', async ({ device }) => {
        const testTags = ['test1', 'test2', 'test3']

        const element = device.createElement(
            new TagPickerLogic({
                onUpdateTagSelection: () => {},
                queryTags: async (query: string) => testTags,
                loadDefaultSuggestions: () => ['bla', 'why?'],
                url: '',
                initialSelectedTags: async () => [],
            }),
        )

        await element.init()

        await element.processEvent('searchInputChanged', { query: 'test' })

        expect(element.state).toEqual({
            loadingQueryResults: false,
            loadingSuggestions: false,
            query: 'test',
            // TODO: Why isn't this as expected?
            displayTags: [
                { name: 'test1' },
                { name: 'test2' },
                { name: 'test3' },
            ],
            selectedTags: [],
            newTagName: 'test',
            suggestions: [],
        })
    })
})
