import '@testing-library/jest-dom'
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import React from 'react'
import {
    render,
    fireEvent,
    getByText,
    waitForElement,
} from '@testing-library/react'
import TagPicker from './index'
import { Tag } from 'src/tags/background/types'

const setup = () => {
    // Testing Data

    const initialSuggestions = [
        { name: 'suggested tag', url: 'http://sugg' },
        { name: 'another suggested tag', url: 'http://sugg2' },
    ] as Tag[]

    const tags = [
        { name: 'abcde1', url: 'http://test1' },
        { name: 'abcde2', url: 'http://test2' },
        { name: 'abcde2 tag', url: 'http://test3' },
        ...initialSuggestions,
    ] as Tag[]

    const tagsSelected = [
        { name: 'Selected', url: 'http://selected' },
        { name: 'Tag', url: 'http://tag' },
    ]

    // Render the tag picker
    const result = render(
        <TagPicker
            queryTags={async query => tags.filter(t => t.name.includes(query))}
            loadSuggestions={() => initialSuggestions}
            url={''}
            onUpdateTagSelection={tags1 => null}
            initialSelectedTags={tagsSelected}
        />,
    )

    // Find the input element
    const input = result.container.querySelector('input')

    // Expose common variables to tests
    return {
        input,
        tags,
        initialSuggestions,
        tagsSelected,
        ...result,
    }
}

// TODO: if query has been changed back to nothing, make sure the initial tags are shown

test('Shows the active tags passed to it', async () => {
    const { tagsSelected, container } = setup()
    await waitForElement(
        () => [
            getByText(container, tagsSelected[0].name),
            getByText(container, tagsSelected[1].name),
        ],
        { container },
    )
})

test('Shows relevant tags when typed into search box', async () => {
    const { tags, initialSuggestions, input, container } = setup()
    const query = 'tag'

    // Should first show initial tag suggestions
    expect(input.value).toEqual('')
    await waitForElement(
        () => [
            getByText(container, initialSuggestions[0].name),
            getByText(container, initialSuggestions[1].name),
        ],
        { container },
    )

    // Then on changing the input,
    fireEvent.change(input, {
        target: { value: query },
    })
    expect(input.value).toEqual(query)

    // Wait for the query results list to show an element which includes a textual tag result from our test data
    const [tagEl1] = await waitForElement(
        () => [
            getByText(container, tags[2].name),
            getByText(container, initialSuggestions[0].name),
            getByText(container, initialSuggestions[1].name),
        ],
        { container },
    )

    fireEvent.click(tagEl1)

    // TODO: Expect the input/TagPicker to have changed in way that reflects this click of a tag (Once implemented in the TagPicker itself)
})
