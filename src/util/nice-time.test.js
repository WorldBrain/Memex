/* eslint-env jest */

import niceTime from './nice-time'

describe('niceTime', () => {
    test('should return now for timeperiod of less than 90 seconds', () => {
        const date = new Date()
        expect(niceTime(date)).toBe('now')
    })

    test('should return minutes for timeperiod of less than 600 seconds', () => {
        const date = new Date(2016, 7, 2, 14, 25)
        const now = new Date(2016, 7, 2, 14, 45)
        expect(niceTime(date, { now })).toBe('20 minutes ago')
    })

    test('should return timeperiod stamp for timeperiod less than 24 hours', () => {
        const date = new Date(2016, 7, 2, 14, 25)
        const now = new Date(2016, 7, 2, 18, 55)
        expect(niceTime(date, { now })).toBe('14:25')
    })

    test('should return the timeperiod stamp and the day for timeperiod less than 24 hours but not on the same day', () => {
        const date = new Date(2016, 7, 2, 14, 25)
        const now = new Date(2016, 7, 3, 10, 55)
        expect(niceTime(date, { now })).toBe('Yesterday 14:25')
    })

    test('should return the day and timestamp for timeperiod less than 3 days', () => {
        const date = new Date(2016, 7, 2, 14, 25)
        const now = new Date(2016, 7, 4, 18, 55)
        expect(niceTime(date, { now })).toBe('Tue 14:25')
    })

    test('should return the date and the month for timeperiod in the same year', () => {
        const date = new Date(2016, 7, 2, 14, 25)
        const now = new Date(2016, 9, 2, 18, 55)
        expect(niceTime(date, { now })).toBe('2 Aug')
    })

    test('should return the date, month and year for timeperiod not in the same year', () => {
        const date = new Date(2016, 7, 2, 14, 25)
        const now = new Date(2017, 7, 2, 18, 55)
        expect(niceTime(date, { now })).toBe('2 Aug 2016')
    })

    test('should return the placeholder for invalid date', () => {
        const date = new Date(2016, 7, 3, 14, 25)
        const now = new Date(2016, 7, 2, 18, 55)
        expect(niceTime(date, { now })).toBe('soon?!')
    })
})
