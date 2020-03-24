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
                initialSelectedTags: [],
            }),
        )

        await element.init()
        expect(element.state).toEqual({
            initialTags: ['bla', 'why?'],
            loadingQueryResults: false,
            loadingSuggestions: false,
            query: '',
            queryResults: [],
            selectedTags: [],
            suggestions: [],
        })
    })
})
