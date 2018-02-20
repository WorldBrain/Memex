/* eslint-env jest */

import transform from './transform-page-text'

describe('Transform page text', () => {
    test('it should be able to tokenize a text', async () => {
        const text = 'very often the people forget to optimize important code'
        const result = transform({ text })
        expect(result).toEqual({
            text: 'people forget optimize important code',
            lenBefore: text.length,
            lenAfter: 37,
        })
    })

    test('it should remove urls', async () => {
        const text =
            'very often the people (https://the-people.com) forget to optimize important code'
        const result = transform({ text })
        expect(result).toEqual({
            text: 'people forget optimize important code',
            lenBefore: text.length,
            lenAfter: 37,
        })
    })
})
