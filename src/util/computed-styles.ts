import { getLuminance } from 'polished'

// Converts a hexidecimal color string to rgb number array
export const hexToRgb = (hex: string): number[] => {
    const hexString = hex.slice(1)
    if (hexString.length > 3) {
        return [
            parseInt(`${hexString[0]}${hexString[1]}`, 16),
            parseInt(`${hexString[2]}${hexString[3]}`, 16),
            parseInt(`${hexString[4]}${hexString[5]}`, 16),
        ]
    }
    return [
        parseInt(`${hexString[0]}${hexString[0]}`, 16),
        parseInt(`${hexString[1]}${hexString[1]}`, 16),
        parseInt(`${hexString[2]}${hexString[2]}`, 16),
    ]
}

const parseColor = (color: string): boolean => {
    switch (true) {
        case color.startsWith('#'): // hex color
            return true
        case color.startsWith('r'): // rgb(a)
            return true
        case Boolean(cssNamedColors[color]): // named colors (e.g. papayawhip)
            return true
        default:
            return false
    }
}
// Takes a color string and deterimes whether or not it is "dark" by calculating its luminance
export const isColorDark = (color: string, darkLuminanceUpperBound = 0.179) =>
    getLuminance(color) < darkLuminanceUpperBound

const parseBackgroundProperties = (
    background: string,
    backgroundColor: string,
) => {
    const backgroundIsParsable = parseColor(background)
    const backgroundColorIsParsable = parseColor(backgroundColor)
    switch (true) {
        case backgroundIsParsable && backgroundColorIsParsable: {
            // if both are parsable, background-color will take precedence
            return isColorDark(backgroundColor)
        }
        case backgroundIsParsable && !backgroundColorIsParsable: {
            // bg is parseable, but bg-color is not
            return isColorDark(background)
        }
        case !backgroundIsParsable && backgroundColorIsParsable: {
            // bg is not parsable, but bg-color is
            return isColorDark(backgroundColor)
        }
        case !backgroundIsParsable && !backgroundColorIsParsable: {
            // neither can be parsed
            return false
        }
        default:
            return false
    }
}

// Calculates the background or background-color of an element
export const areElementStylesDark = (el: HTMLElement): boolean => {
    const computedStyles = getComputedStyle(el)
    const { background, backgroundColor } = computedStyles
    const hasBackgroundPropertySet = background.length > 0
    const hasBackgroundColorPropertySet = backgroundColor.length > 0
    switch (true) {
        case hasBackgroundPropertySet && hasBackgroundColorPropertySet:
            return parseBackgroundProperties(background, backgroundColor)
        case hasBackgroundPropertySet && !hasBackgroundColorPropertySet:
            return isColorDark(background)
        case !hasBackgroundPropertySet && hasBackgroundColorPropertySet:
            return isColorDark(backgroundColor)
        default:
            return false
    }
}

const cssNamedColors = {
    aliceblue: '#f0f8ff',
    antiquewhite: '#faebd7',
    aqua: '#00ffff',
    aquamarine: '#7fffd4',
    azure: '#f0ffff',
    beige: '#f5f5dc',
    bisque: '#ffe4c4',
    black: '#000',
    blanchedalmond: '#ffebcd',
    blue: '#0000ff',
    blueviolet: '#8a2be2',
    brown: '#a52a2a',
    burlywood: '#deb887',
    cadetblue: '#5f9ea0',
    chartreuse: '#7fff00',
    chocolate: '#d2691e',
    coral: '#ff7f50',
    cornflowerblue: '#6495ed',
    cornsilk: '#fff8dc',
    crimson: '#dc143c',
    cyan: '#00ffff',
    darkblue: '#00008b',
    darkcyan: '#008b8b',
    darkgoldenrod: '#b8860b',
    darkgray: '#a9a9a9',
    darkgreen: '#006400',
    darkgrey: '#a9a9a9',
    darkkhaki: '#bdb76b',
    darkmagenta: '#8b008b',
    darkolivegreen: '#556b2f',
    darkorange: '#ff8c00',
    darkorchid: '#9932cc',
    darkred: '#8b0000',
    darksalmon: '#e9967a',
    darkseagreen: '#8fbc8f',
    darkslateblue: '#483d8b',
    darkslategray: '#2f4f4f',
    darkslategrey: '#2f4f4f',
    darkturquoise: '#00ced1',
    darkviolet: '#9400d3',
    deeppink: '#ff1493',
    deepskyblue: '#00bfff',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1e90ff',
    firebrick: '#b22222',
    floralwhite: '#fffaf0',
    forestgreen: '#228b22',
    fuchsia: '#ff00ff',
    gainsboro: '#dcdcdc',
    ghostwhite: '#f8f8ff',
    gold: '#ffd700',
    goldenrod: '#daa520',
    gray: '#808080',
    green: '#008000',
    greenyellow: '#adff2f',
    grey: '#808080',
    honeydew: '#f0fff0',
    hotpink: '#ff69b4',
    indianred: '#cd5c5c',
    indigo: '#4b0082',
    ivory: '#fffff0',
    khaki: '#f0e68c',
    lavender: '#e6e6fa',
    lavenderblush: '#fff0f5',
    lawngreen: '#7cfc00',
    lemonchiffon: '#fffacd',
    lightblue: '#add8e6',
    lightcoral: '#f08080',
    lightcyan: '#e0ffff',
    lightgoldenrodyellow: '#fafad2',
    lightgray: '#d3d3d3',
    lightgreen: '#90ee90',
    lightgrey: '#d3d3d3',
    lightpink: '#ffb6c1',
    lightsalmon: '#ffa07a',
    lightseagreen: '#20b2aa',
    lightskyblue: '#87cefa',
    lightslategray: '#789',
    lightslategrey: '#789',
    lightsteelblue: '#b0c4de',
    lightyellow: '#ffffe0',
    lime: '#0f0',
    limegreen: '#32cd32',
    linen: '#faf0e6',
    magenta: '#f0f',
    maroon: '#800000',
    mediumaquamarine: '#66cdaa',
    mediumblue: '#0000cd',
    mediumorchid: '#ba55d3',
    mediumpurple: '#9370db',
    mediumseagreen: '#3cb371',
    mediumslateblue: '#7b68ee',
    mediumspringgreen: '#00fa9a',
    mediumturquoise: '#48d1cc',
    mediumvioletred: '#c71585',
    midnightblue: '#191970',
    mintcream: '#f5fffa',
    mistyrose: '#ffe4e1',
    moccasin: '#ffe4b5',
    navajowhite: '#ffdead',
    navy: '#000080',
    oldlace: '#fdf5e6',
    olive: '#808000',
    olivedrab: '#6b8e23',
    orange: '#ffa500',
    orangered: '#ff4500',
    orchid: '#da70d6',
    palegoldenrod: '#eee8aa',
    palegreen: '#98fb98',
    paleturquoise: '#afeeee',
    palevioletred: '#db7093',
    papayawhip: '#ffefd5',
    peachpuff: '#ffdab9',
    peru: '#cd853f',
    pink: '#ffc0cb',
    plum: '#dda0dd',
    powderblue: '#b0e0e6',
    purple: '#800080',
    rebeccapurple: '#639',
    red: '#f00',
    rosybrown: '#bc8f8f',
    royalblue: '#4169e1',
    saddlebrown: '#8b4513',
    salmon: '#fa8072',
    sandybrown: '#f4a460',
    seagreen: '#2e8b57',
    seashell: '#fff5ee',
    sienna: '#a0522d',
    silver: '#c0c0c0',
    skyblue: '#87ceeb',
    slateblue: '#6a5acd',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#fffafa',
    springgreen: '#00ff7f',
    steelblue: '#4682b4',
    tan: '#d2b48c',
    teal: '#008080',
    thistle: '#d8bfd8',
    tomato: '#ff6347',
    turquoise: '#40e0d0',
    violet: '#ee82ee',
    wheat: '#f5deb3',
    white: '#fff',
    whitesmoke: '#f5f5f5',
    yellow: '#ff0',
    yellowgreen: '#9acd32',
}
