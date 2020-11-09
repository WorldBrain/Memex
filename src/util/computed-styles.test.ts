/* eslint-env jest */

import { isColorDark, hexToRgb } from './computed-styles'

describe('checkBGColor', () => {
    test('should return true for dark background colors', () => {
        expect(isColorDark('#000')).toBe(true)
        expect(isColorDark('#FFF')).toBe(false)
        expect(isColorDark('rgb(0,0,0)')).toBe(true)
        expect(isColorDark('rgba(0,0,0,1)')).toBe(true)
        expect(isColorDark('white')).toBe(false)
        expect(isColorDark('blanchedalmond')).toBe(false)
        expect(isColorDark('slate')).toBe(true)
        expect(isColorDark('#BADA55')).toBe(false)
    })
})

describe('hexToRgb', () => {
    test('should parse hex colors to rgba number arrays', () => {
        expect(hexToRgb('#000')).toEqual([0, 0, 0])
        expect(hexToRgb('#FFF')).toEqual([255, 255, 255])
        expect(hexToRgb('#BADA55')).toEqual([186, 218, 85])
    })
})
