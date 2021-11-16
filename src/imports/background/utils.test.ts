import expect from 'expect'

import { normalizeTimestamp } from './utils'

describe('normalizing timestamp tests', () => {
    it('should leave correct timestamps untouched', () => {
        const timestamps = [1566980564800, 1566980562800, 1566980524800]

        for (const timestamp of timestamps) {
            expect(normalizeTimestamp(timestamp)).toEqual(timestamp)
        }
    })

    it('should pad short timestamps with zeroes', () => {
        const timestampA = 15669805
        const timestampB = 156698056
        const timestampC = 1566980562

        expect(normalizeTimestamp(timestampA)).toEqual(1566980500000)
        expect(normalizeTimestamp(timestampB)).toEqual(1566980560000)
        expect(normalizeTimestamp(timestampC)).toEqual(1566980562000)
    })

    it('should shave long timestamps to expected length', () => {
        const timestampA = 15669805000000
        const timestampB = 156698050000000
        const timestampC = 1566980500000000

        expect(normalizeTimestamp(timestampA)).toEqual(1566980500000)
        expect(normalizeTimestamp(timestampB)).toEqual(1566980500000)
        expect(normalizeTimestamp(timestampC)).toEqual(1566980500000)
    })
})
