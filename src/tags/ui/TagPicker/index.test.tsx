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
import TagPicker from './index'
import { TagPickerDependencies } from 'src/tags/ui/TagPicker/logic'

const initialSuggestions = ['suggested tag', 'another tag']
const tags = ['tag a', 'abcde1', 'abcde2', 'abcde2 tag', ...initialSuggestions]
const tagsSelected = ['Selected', 'Tag', 'suggested tag']

const setupDependencies = () => {
    // const queryEntries = tags.
}

const renderTag = (opts: Partial<TagPickerDependencies> = {}) => {
    const renderResult = render(
        <TagPicker
            queryEntries={async (query) =>
                tags.filter((t) => t.includes(query))
            }
            loadDefaultSuggestions={() => initialSuggestions}
            onUpdateEntrySelection={(tags1) => null}
            initialSelectedEntries={async () => tagsSelected}
            actOnAllTabs={(tagName: string) => null}
            {...opts}
        />,
    )
    return renderResult.container
}

const findElements = (container) => ({
    container,
    input: container.querySelector('input'),
    tagSearchBox: container.querySelector('#tagSearchBox'),
    tagResults: container.querySelector('#tagResults'),
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
                () => text.map((tag) => getByText(element ?? container, tag)),
                {
                    container: element ?? container,
                },
            ),
    },
})

const expectToFindTexts = (container, text: string[]) =>
    waitForElement(() => text.map((tag) => getByText(container, tag)), {
        container,
    })

const changeInput = (input, text) =>
    fireEvent.change(input, {
        target: { value: text },
    })

// TODO: if query has been changed back to nothing, make sure the initial tags are shown

/*test('Shows the pre-selected tags', async () => {
    const { tagSearchBox } = renderTag()
    await expectToSeeText(tagSearchBox, tagsSelected)
})

test('Shows the same pre-selected tags after search', async () => {
    const { input, tagSearchBox } = renderTag()
    await expectToSeeText(tagSearchBox, tagsSelected)
    changeInput(input, 'Test Search')
    await expectToSeeText(tagSearchBox, tagsSelected)
})

test('After search and select, adds the selected tag, subsequent clicks remove', async () => {
    const { input, tagSearchBox, tagResults } = renderTag()
    const query = 'abcde1'
    await expectToSeeText(tagSearchBox, tagsSelected)
    changeInput(input, query)
    await expectToSeeText(tagResults, [query])
    const queryResultTag = await findByText(tagResults as HTMLElement, query)
    queryResultTag.click()
    await expectToSeeText(tagSearchBox, [...tagsSelected, query])

    // This next search and click should remove it
    const queryResult2Tag = await findByText(tagResults as HTMLElement, query)
    queryResult2Tag.click()
    await expectToSeeText(tagSearchBox, [...tagsSelected])
    expect(queryByText(tagSearchBox as HTMLElement, query)).toBeNull()
})

test('After search and select, removes the selected tag', async () => {
    const { container, input } = renderTag()
    await expectToSeeText(container, tagsSelected)
    changeInput(input, 'Test Search')
    await expectToSeeText(container, tagsSelected)
})*/

test('Shows relevant tags when typed into search box', async () => {
    const container = renderTag()
    const elements = findElements(container)
    const { changes, tests } = testUtils(elements)
    const query = 'tag'

    await tests.expectToFindStrings(tagsSelected, elements.tagSearchBox)
    await tests.expectToFindStrings(initialSuggestions, elements.tagResults)

    // Then on changing the input,
    changes.typeIntoInput(query)
    await tests.expectInputToEqual(query)

    // Wait for the query results list to show an element which includes a textual tag result from our test data
    const [tagEl1] = await tests.expectToFindStrings(
        ['suggested tag'],
        elements.tagResults,
    )

    // 'Add tag: $query'
    fireEvent.click(tagEl1)

    // TODO: Perhaps need to make this into an E2E test with a backend storage implementation for this to work, instead of dummy functions.
    // await waitFor( async() =>  tests.expectToFindStrings(['suggested tag'],elements.tagSearchBox))
})
