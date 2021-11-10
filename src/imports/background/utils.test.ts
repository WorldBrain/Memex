import expect from 'expect'

import { padShortTimestamp, shaveLongTimestamp } from './utils'

describe('padding of short epoch timestamp tests', () => {
    it('should throw errors on long timestamps', () => {
        const timestamps = [
            1566980564800234,
            15669805648001566980564800,
            156698056480015669805648001566980564800,
        ]

        for (const timestamp of timestamps) {
            expect(() => padShortTimestamp(timestamp)).toThrow(Error)
        }
    })

    it('should leave correct timestamps untouched', () => {
        const timestamps = [1566980564800, 1566980562800, 1566980524800]

        for (const timestamp of timestamps) {
            expect(padShortTimestamp(timestamp)).toEqual(timestamp)
        }
    })

    it('should pad short timestamps with zeroes', () => {
        const timestampA = 15669805
        const timestampB = 156698056
        const timestampC = 1566980562

        expect(padShortTimestamp(timestampA)).toEqual(1566980500000)
        expect(padShortTimestamp(timestampB)).toEqual(1566980560000)
        expect(padShortTimestamp(timestampC)).toEqual(1566980562000)
    })
})

describe('shaving of milisecond timestamp tests', () => {
    it('should throw errors on long timestamps', () => {
        const timestamps = [1566980, 156698, 15669]

        for (const timestamp of timestamps) {
            expect(() => padShortTimestamp(timestamp)).toThrow(Error)
        }
    })
    it('should leave correct timestamps untouched', () => {
        const timestamps = [1566980564800, 1566980562800, 1566980524800]

        for (const timestamp of timestamps) {
            expect(shaveLongTimestamp(timestamp)).toEqual(timestamp)
        }
    })

    it('should pad short timestamps with zeroes', () => {
        const timestampA = 15669805000000
        const timestampB = 156698050000000
        const timestampC = 1566980500000000

        expect(shaveLongTimestamp(timestampA)).toEqual(1566980500000)
        expect(shaveLongTimestamp(timestampB)).toEqual(1566980500000)
        expect(shaveLongTimestamp(timestampC)).toEqual(1566980500000)
    })
})
