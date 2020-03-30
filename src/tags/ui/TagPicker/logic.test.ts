import TagPickerLogic, { TagPickerState } from './logic'
import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import 'jest-extended'

// see https://github.com/WorldBrain/Memex-Mobile/blob/develop/app/src/features/overview/ui/screens/dashboard/logic.test.ts
// see https://github.com/WorldBrain/Memex-Mobile/blob/7b74b83d3f3ebec793317c84222939d3fcba67b7/app/src/ui/index.tests.ts#L3

const stateHelper = ({
    tagResultListSelected,
    tagResultListNotSelected,
    tagResultListFocused,
    selectedTags,
    query,
    newTagButton,
}: {
    tagResultListSelected?: string[]
    tagResultListNotSelected?: string[]
    tagResultListFocused?: string[]
    selectedTags?: string[]
    query?: string
    newTagButton?: boolean
}) => ({
    displayTags: [
        ...(tagResultListFocused ?? []).map(t => ({
            name: t,
            focused: true,
            selected: false,
        })),
        ...(tagResultListNotSelected ?? [])
            .filter(t => !(tagResultListFocused ?? []).includes(t))
            .map(t => ({
                name: t,
                focused: false,
                selected: false,
            })),
        ...(tagResultListSelected ?? [])
            .filter(t => !(tagResultListFocused ?? []).includes(t))
            .map(t => ({
                name: t,
                focused: false,
                selected: true,
            })),
    ],
    selectedTags: selectedTags ?? [],
    loadingQueryResults: false,
    loadingSuggestions: false,
    query: query ?? '',
    newTagName: newTagButton ? query : '',
})

const setupLogicHelper = async ({
    device,
    onUpdateTagSelection,
    queryTags,
    queryTagResults,
    initialSuggestions,
    initialSelectedTags,
}: {
    device: any
    onUpdateTagSelection?: () => false
    queryTags?: (query: string) => Promise<string[]>
    queryTagResults?: string[]
    initialSuggestions?: string[]
    initialSelectedTags?: string[]
}) => {
    const logic = device.createElement(
        new TagPickerLogic({
            onUpdateTagSelection: onUpdateTagSelection || (() => false),
            queryTags:
                queryTags ?? queryTagResults
                    ? async (query: string) => queryTagResults
                    : async (query: string) => [],
            loadDefaultSuggestions: () => initialSuggestions ?? [],
            initialSelectedTags: async () => initialSelectedTags ?? [],
        }),
    )
    await logic.init()
    return logic
}

const expectStateToEqual = (
    resultState: TagPickerState,
    expectedState: TagPickerState,
) => {
    const { displayTags: queryTagsResult, ...restResult } = resultState
    const { displayTags: queryTagsExpected, ...restExpected } = expectedState
    expect(restResult).toEqual(restExpected)
    // Compares the array state without caring about order
    expect(queryTagsResult).toIncludeSameMembers(queryTagsExpected)
}

describe('TagPickerLogic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should correctly load initial tags', async ({ device }) => {
        const initialSuggestions = ['sugg1', 'sugg2']

        const element = await setupLogicHelper({ device, initialSuggestions })

        expect(element.state).toEqual(
            stateHelper({ tagResultListNotSelected: initialSuggestions }),
        )
    })

    it('should correctly load initial tags and set those selected when selected are in initial tags', async ({
        device,
    }) => {
        const initialSuggestions = ['sugg1', 'sugg2', 'test1']
        const initialSelectedTags = ['test1']

        const element = await setupLogicHelper({
            device,
            initialSuggestions,
            initialSelectedTags,
        })

        expectStateToEqual(
            element.state,
            stateHelper({
                tagResultListNotSelected: ['sugg1', 'sugg2'],
                tagResultListSelected: initialSelectedTags,
                selectedTags: initialSelectedTags,
            }),
        )
    })
    it('should correctly load initial tags and set those selected when selected are not in initial tags', async ({
        device,
    }) => {
        const initialSuggestions = ['sugg1', 'sugg2']
        const initialSelectedTags = ['test1']

        const element = await setupLogicHelper({
            device,
            initialSuggestions,
            initialSelectedTags,
        })

        expect(element.state).toEqual(
            stateHelper({
                tagResultListNotSelected: ['sugg1', 'sugg2'],
                selectedTags: initialSelectedTags,
            }),
        )
    })

    it('should correctly search for a tag when tag is already selected', async ({
        device,
    }) => {
        const initialSuggestions = ['sugg1', 'sugg2']
        const initialSelectedTags = ['test1']

        const element = await setupLogicHelper({
            device,
            initialSuggestions,
            initialSelectedTags,
            queryTagResults: ['test1'],
        })
        await element.processEvent('searchInputChanged', { query: 'test' })

        expect(element.state).toEqual(
            stateHelper({
                tagResultListSelected: ['test1'],
                selectedTags: initialSelectedTags,
                query: 'test',
                newTagButton: true,
            }),
        )
    })

    it('should correctly search for a tag when tag is not selected', async ({
        device,
    }) => {
        const initialSuggestions = ['sugg1', 'sugg2']
        const initialSelectedTags = ['something']

        const element = await setupLogicHelper({
            device,
            initialSuggestions,
            initialSelectedTags,
            queryTagResults: ['test1'],
        })
        await element.processEvent('searchInputChanged', { query: 'test' })

        expect(element.state).toEqual(
            stateHelper({
                tagResultListNotSelected: ['test1'],
                selectedTags: initialSelectedTags,
                query: 'test',
                newTagButton: true,
            }),
        )
    })

    it('should correctly navigate the search results by up and down arrows', async ({
        device,
    }) => {
        const initialSuggestions = ['sugg1', 'sugg2']
        const initialSelectedTags = ['something']
        const queryTagResults = ['test1', 'test2', 'test3', 'test4']

        const element = await setupLogicHelper({
            device,
            initialSuggestions,
            initialSelectedTags,
            queryTagResults,
        })
        await element.processEvent('searchInputChanged', { query: 'test' })

        expect(element.state).toEqual(
            stateHelper({
                tagResultListNotSelected: queryTagResults,
                selectedTags: initialSelectedTags,
                query: 'test',
                newTagButton: true,
            }),
        )

        const expectStateToEqualWithFocus = focusedTag =>
            expectStateToEqual(
                element.state,
                stateHelper({
                    tagResultListNotSelected: queryTagResults,
                    selectedTags: initialSelectedTags,
                    tagResultListFocused: focusedTag ? [focusedTag] : [],
                    query: 'test',
                    newTagButton: true,
                }),
            )

        const keyPressAndExpectFocus = async sequence => {
            for (const seq of sequence) {
                await element.processEvent('keyPress', { key: seq[0] })
                expectStateToEqualWithFocus(seq[1])
            }
        }

        await keyPressAndExpectFocus([
            ['ArrowDown', 'test1'],
            ['ArrowDown', 'test2'],
            ['ArrowDown', 'test3'],
            ['ArrowDown', 'test4'],
            ['ArrowDown', 'test4'],
            ['ArrowDown', 'test4'],
            ['ArrowDown', 'test4'],
            ['ArrowUp', 'test3'],
            ['ArrowUp', 'test2'],
            ['ArrowUp', 'test1'],
            // This is navigating beyond the initial result, which is the 'New Tag: ... ' button, so no tag will be selected
            ['ArrowUp'],
            ['ArrowUp'],
            ['ArrowUp'],
            ['ArrowDown', 'test1'],
        ])
    })
})
