/* eslint-env jest */

import { transformPageText } from '@worldbrain/memex-stemmer/lib/transform-page-text'

describe('Transform page text', () => {
    test.skip('it should be able to tokenize a text', async () => {
        const text = 'very often the people forget to optimize important code'
        const result = transformPageText(text)
        expect(result).toEqual({
            text: 'people forget optimize important code',
            lenBefore: text.length,
            lenAfter: 37,
        })
    })

    test.skip('it should remove urls', async () => {
        const text =
            'very often the people (https://the-people.com) forget to optimize important code'
        const result = transformPageText(text)
        expect(result).toEqual({
            text: 'people forget optimize important code',
            lenBefore: text.length,
            lenAfter: 37,
        })
    })
})
