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
    const tags = [
        { name: 'abcde1', url: 'http://test1' },
        { name: 'abcde2', url: 'http://test2' },
    ] as Tag[]

    const initialSuggestions = [
        { name: 'suggested tag', url: 'http://sugg' },
        { name: 'another suggested tag', url: 'http://sugg2' },
    ] as Tag[]

    // Render the tag picker
    const result = render(
        <TagPicker
            queryTags={async query => tags}
            initialTags={async () => initialSuggestions}
        />,
    )

    // Find the input element
    const input = result.container.querySelector('input')

    // Expose common variables to tests
    return {
        input,
        tags,
        initialSuggestions,
        ...result,
    }
}

test('Shows relevant tags when typed into search box', async () => {
    const { tags, initialSuggestions, input, container } = setup()
    const query = 'abc'

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
            getByText(container, tags[0].name),
            getByText(container, tags[1].name),
        ],
        { container },
    )

    fireEvent.click(tagEl1)

    // TODO: Expect the input/TagPicker to have changed in way that reflects this click of a tag (Once implemented in the TagPicker itself)
})
