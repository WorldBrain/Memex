/* eslint-env jest */

import { checkBGColor, hexToRgb } from './computed-styles'

describe('checkBGColor', () => {
    test('should return true for dark background colors', () => {
        expect(checkBGColor('#000')).toBe(true)
        expect(checkBGColor('#FFF')).toBe(false)
        expect(checkBGColor('rgb(0,0,0)')).toBe(true)
        expect(checkBGColor('rgba(0,0,0,1)')).toBe(true)
        expect(checkBGColor('white')).toBe(false)
        expect(checkBGColor('blanchedalmond')).toBe(false)
        expect(checkBGColor('slate')).toBe(true)
        expect(checkBGColor('#BADA55')).toBe(false)
    })
})

describe('hexToRgb', () => {
    test('should parse hex colors to rgba number arrays', () => {
        expect(hexToRgb('#000')).toEqual([0, 0, 0])
        expect(hexToRgb('#FFF')).toEqual([255, 255, 255])
        expect(hexToRgb('#BADA55')).toEqual([186, 218, 85])
    })
})
