import { isColorDark, hexToRgb } from './dark-mode-detection'

describe('checkBGColor', () => {
    test('should return true for dark background colors', () => {
        expect(isColorDark('#000')).toBe(true)
        expect(isColorDark('#FFF')).toBe(false)
        expect(isColorDark('rgb(0,0,0)')).toBe(true)
        expect(isColorDark('rgba(0,0,0,1)')).toBe(true)
        expect(isColorDark('white')).toBe(false)
        expect(isColorDark('blanchedalmond')).toBe(false)
        expect(isColorDark('transparent')).toBe(true)
        expect(isColorDark('#BADA55')).toBe(false)
        expect(isColorDark('hsl(36,10%,90%)')).toBe(false)
        expect(isColorDark('hsl(16,25%,38%)')).toBe(true)
    })
})

describe('hexToRgb', () => {
    test('should parse hex colors to rgba number arrays', () => {
        expect(hexToRgb('#000')).toEqual([0, 0, 0])
        expect(hexToRgb('#FFF')).toEqual([255, 255, 255])
        expect(hexToRgb('#BADA55')).toEqual([186, 218, 85])
    })
})
