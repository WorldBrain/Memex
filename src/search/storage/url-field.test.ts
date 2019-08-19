import expect from 'expect'

import UrlField from './url-field'

const WEBSITE_URLS = [
    'twitter.com/testA',
    'https://twitter.com/testB',
    'twitter.com/test+123',
]

const SOCIAL_POST_URLS = [
    'socialPosts:1',
    'socialPosts:25',
    'socialPosts:10123',
]

describe('UrlField URL field pre-processing tests', () => {
    let urlField: UrlField

    beforeEach(() => {
        urlField = new UrlField()
    })

    describe('pre-storage processing', () => {
        it('should normalize website URLs', async () => {
            const result = await Promise.all(
                WEBSITE_URLS.map(url => urlField.prepareForStorage(url)),
            )

            expect(result).toEqual([
                'twitter.com/testA',
                'twitter.com/testB',
                'twitter.com/test+123',
            ])
        })

        it('should skip normalization of social post URL IDs', async () => {
            const results = await Promise.all(
                SOCIAL_POST_URLS.map(url => urlField.prepareForStorage(url)),
            )

            expect(results).toEqual(SOCIAL_POST_URLS)
        })
    })

    describe('post-storage processing', () => {
        it('should not change any URLs', async () => {
            expect(
                await Promise.all(
                    WEBSITE_URLS.map(url => urlField.prepareFromStorage(url)),
                ),
            ).toEqual(WEBSITE_URLS)

            expect(
                await Promise.all(
                    SOCIAL_POST_URLS.map(url =>
                        urlField.prepareFromStorage(url),
                    ),
                ),
            ).toEqual(SOCIAL_POST_URLS)
        })
    })
})
