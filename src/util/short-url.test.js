/* eslint-env jest */

import shortUrl from './short-url'

describe('shortUrl', () => {
    test('should shorten the url to given number of characters', () => {
        const url = shortUrl('https://example.com/page', 5)
        expect(url).toBe('ex...')
    })

    test('should remove "http" prefix if url is within maxLength', () => {
        const url = shortUrl('https://example.com/page')
        expect(url).toBe('example.com/page')
    })

    test('should slice the data uri', () => {
        const dataUri =
            'data:text/plain;charset=utf-8;base64,aHR0cHM6Ly9leGFtcGxlLmNvbS9wdWJsaWMvaW1hZ2UvYmFja2dyb3VuZC5qcGVn'
        const url = shortUrl(dataUri)
        expect(url).toBe('data:text/plain;charset=utf-8;base64,aHR0cHM6Ly...')
    })
})
