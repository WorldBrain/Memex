import '@testing-library/jest-dom'
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import React from 'react'
import {
    render,
    fireEvent,
    getByText,
    findByText,
    waitForElement,
    queryByText,
} from '@testing-library/react'
import { waitFor, wait } from '@testing-library/dom'
import ListPicker from './index'
import { ListPickerDependencies } from 'src/custom-lists/ui/CollectionPicker/logic'

const initialSuggestions = ['suggested list', 'another list']
const lists = [
    'list a',
    'abcde1',
    'abcde2',
    'abcde2 list',
    ...initialSuggestions,
]
const listsSelected = ['Selected', 'List', 'suggested list']

const setupDependencies = () => {
    // const queryEntries = lists.
}

const renderList = (opts: Partial<ListPickerDependencies> = {}) => {
    const renderResult = render(
        <ListPicker
            queryEntries={async (query) =>
                lists.filter((t) => t.includes(query))
            }
            loadDefaultSuggestions={() => initialSuggestions}
            onUpdateEntrySelection={(lists1) => null}
            initialSelectedEntries={async () => listsSelected}
            actOnAllTabs={(listName: string) => null}
            {...opts}
        />,
    )
    return renderResult.container
}

const findElements = (container) => ({
    container,
    input: container.querySelector('input'),
    listSearchBox: container.querySelector('#listSearchBox'),
    listResults: container.querySelector('#listResults'),
})

const testUtils = ({ input, container }) => ({
    changes: {
        typeIntoInput: (text) => {
            for (let i = 1; i < text.length - 1; i++) {
                fireEvent.change(input, { target: { value: text.slice(0, i) } })
            }
            input.value = text
        },
    },

    tests: {
        expectInputToEqual: (val) =>
            waitFor(() => expect(input.value).toEqual(val), { timeout: 200 }),
        expectToFindStrings: (text: string[], element?: any) =>
            waitForElement(
                () => text.map((list) => getByText(element ?? container, list)),
                {
                    container: element ?? container,
                },
            ),
    },
})

const expectToFindTexts = (container, text: string[]) =>
    waitForElement(() => text.map((list) => getByText(container, list)), {
        container,
    })

const changeInput = (input, text) =>
    fireEvent.change(input, {
        target: { value: text },
    })

// TODO: if query has been changed back to nothing, make sure the initial lists are shown

/*test('Shows the pre-selected lists', async () => {
    const { listSearchBox } = renderList()
    await expectToSeeText(listSearchBox, listsSelected)
})

test('Shows the same pre-selected lists after search', async () => {
    const { input, listSearchBox } = renderList()
    await expectToSeeText(listSearchBox, listsSelected)
    changeInput(input, 'Test Search')
    await expectToSeeText(listSearchBox, listsSelected)
})

test('After search and select, adds the selected list, subsequent clicks remove', async () => {
    const { input, listSearchBox, listResults } = renderList()
    const query = 'abcde1'
    await expectToSeeText(listSearchBox, listsSelected)
    changeInput(input, query)
    await expectToSeeText(listResults, [query])
    const queryResultList = await findByText(listResults as HTMLElement, query)
    queryResultList.click()
    await expectToSeeText(listSearchBox, [...listsSelected, query])

    // This next search and click should remove it
    const queryResult2List = await findByText(listResults as HTMLElement, query)
    queryResult2List.click()
    await expectToSeeText(listSearchBox, [...listsSelected])
    expect(queryByText(listSearchBox as HTMLElement, query)).toBeNull()
})

test('After search and select, removes the selected list', async () => {
    const { container, input } = renderList()
    await expectToSeeText(container, listsSelected)
    changeInput(input, 'Test Search')
    await expectToSeeText(container, listsSelected)
})*/

test.skip('Shows relevant lists when typed into search box', async () => {
    const container = renderList()
    const elements = findElements(container)
    const { changes, tests } = testUtils(elements)
    const query = 'list'

    await tests.expectToFindStrings(listsSelected, elements.listSearchBox)
    await tests.expectToFindStrings(initialSuggestions, elements.listResults)

    // Then on changing the input,
    changes.typeIntoInput(query)
    await tests.expectInputToEqual(query)

    // Wait for the query results list to show an element which includes a textual list result from our test data
    const [listEl1] = await tests.expectToFindStrings(
        ['suggested list'],
        elements.listResults,
    )

    // 'Add list: $query'
    fireEvent.click(listEl1)

    // TODO: Perhaps need to make this into an E2E test with a backend storage implementation for this to work, instead of dummy functions.
    // await waitFor( async() =>  tests.expectToFindStrings(['suggested list'],elements.listSearchBox))
})
