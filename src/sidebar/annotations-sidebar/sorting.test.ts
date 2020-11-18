import * as sortingFns from './sorting'
import { TEST_DATA } from './sorting.test.data'

describe('Annotation sorting fns', () => {
    it('should be able to sort by ascending created date', () => {
        const expected = [
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=160/#1605576416084',
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=176/#1605576451441',
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=206/#1605576462134',
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=160/#1605577855754',
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=160/#1605577879786',
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=160/#1605581863240',
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=160/#1605585963681',
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=160/#1605585966900',
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=160/#1605585970016',
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=160/#1605588109153',
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=160/#1605588114635',
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=160/#1605588127811',
        ]

        expect(
            TEST_DATA.sort((a, b) => sortingFns.sortByCreatedTime(a, b)).map(
                (a) => a.url,
            ),
        ).toEqual(expected)

        // The complement sort will also be used
        expect(
            TEST_DATA.sort((a, b) => sortingFns.sortByCreatedTime(b, a)).map(
                (a) => a.url,
            ),
        ).toEqual(expected.reverse())
    })

    it('should be able to sort by page position', () => {
        expect(
            TEST_DATA.sort(sortingFns.sortByPagePosition)
                .slice(TEST_DATA.length - 6) // The last 6 should have highlights and be sorted - the prev ones are outside of the sorting criteria
                .map((a) => a.url),
        ).toEqual([
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=160/#1605585963681',
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=160/#1605588109153',
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=160/#1605585966900',
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=160/#1605585970016',
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=160/#1605588114635',
            'https://www.youtube.com/watch?v=lOIP_Z_-0Hs&feature=youtu.be&t=160/#1605588127811',
        ])
    })
})
