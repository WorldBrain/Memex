/* eslint-env jest */

import {
    makeRangeTransform,
    makeNonlinearTransform,
} from './make-range-transform'

describe('makeRangeTransform', () => {
    test('should work for basic cases', () => {
        const transformFunction = makeRangeTransform({
            domain: [66, 100],
            range: [9, 200],
        })
        expect(transformFunction(79)).toBeCloseTo(82.029, 2)
        expect(transformFunction(43)).toBeCloseTo(-120.205, 2)
        expect(transformFunction(170)).toBeCloseTo(593.235, 2)
    })

    test('should clamp its outputs with clampOutput true', () => {
        const transformFunction = makeRangeTransform({
            domain: [93, 117],
            range: [3, 10],
            clampOutput: true,
        })
        expect(transformFunction(99)).toBeCloseTo(4.75, 2)
        expect(transformFunction(83)).toBe(3)
        expect(transformFunction(150)).toBe(10)
    })

    test('should work with descending domain and/or range', () => {
        const transformFunction1 = makeRangeTransform({
            domain: [100, 0],
            range: [0, 10],
        })
        expect(transformFunction1(80)).toBe(2)
        expect(transformFunction1(-40)).toBe(14)
        expect(transformFunction1(120)).toBe(-2)
        const transformFunction2 = makeRangeTransform({
            domain: [0, 100],
            range: [10, 0],
        })
        expect(transformFunction2(80)).toBe(2)
        expect(transformFunction2(-40)).toBe(14)
        expect(transformFunction2(120)).toBe(-2)
        const transformFunction3 = makeRangeTransform({
            domain: [100, 0],
            range: [10, 0],
        })
        expect(transformFunction3(80)).toBe(8)
        expect(transformFunction3(-40)).toBe(-4)
        expect(transformFunction3(120)).toBe(12)
    })

    test('should work with descending domain and/or range with clamping', () => {
        const transformFunction1 = makeRangeTransform({
            domain: [100, 0],
            range: [0, 10],
            clampOutput: true,
        })
        expect(transformFunction1(80)).toBe(2)
        expect(transformFunction1(-40)).toBe(10)
        expect(transformFunction1(120)).toBe(0)
        const transformFunction2 = makeRangeTransform({
            domain: [0, 100],
            range: [10, 0],
            clampOutput: true,
        })
        expect(transformFunction2(80)).toBe(10)
        expect(transformFunction2(-40)).toBe(10)
        expect(transformFunction2(120)).toBe(10)
        const transformFunction3 = makeRangeTransform({
            domain: [100, 0],
            range: [10, 0],
            clampOutput: true,
        })
        expect(transformFunction3(80)).toBe(10)
        expect(transformFunction3(-40)).toBe(10)
        expect(transformFunction3(120)).toBe(10)
    })
})

describe('makeNonlinearTransform', () => {
    test('should work for basic cases', () => {
        const transformFunction = makeNonlinearTransform({
            domain: [5, 5603],
            range: [0, 100],
            nonlinearity: Math.log,
        })
        expect(transformFunction(5)).toBe(0)
        expect(transformFunction(5603)).toBe(100)
        expect(transformFunction(3)).toBeCloseTo(-7.275, 2)
        expect(transformFunction(1997)).toBeCloseTo(85.3074, 2)
        expect(transformFunction(6000)).toBeCloseTo(100.974, 2)
    })

    test('should clamp its outputs with clampOutput true', () => {
        const transformFunction = makeNonlinearTransform({
            domain: [5, 5603],
            range: [0, 100],
            clampOutput: true,
            nonlinearity: Math.log,
        })
        expect(transformFunction(5)).toBe(0)
        expect(transformFunction(5603)).toBe(100)
        expect(transformFunction(3)).toBe(0)
        expect(transformFunction(1997)).toBeCloseTo(85.3074, 2)
        expect(transformFunction(6000)).toBe(100)
    })
})
