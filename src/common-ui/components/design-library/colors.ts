import { lighten, darken, desaturate } from 'polished'

export const colorButtonHighlightBackground = `rgba(196, 196, 196, 1)`

export const colorBrandMintGreen = `#5CD9A6`
export const colorPrimary = `${colorBrandMintGreen};`
export const colorSecondary = `${colorBrandMintGreen};`
export const colorDisabled = `lightgrey;`
export const colorMidPurple = `#5671CF`
export const colorBlue = `#83c9f4`
export const colorDarkText = `#3A2F45`
export const colorText = `#544960`
export const colorError = `#F45F5F`

// Shades of grey listed in Figma file. Scale to be from 1-9 from light to dark
export const colorWhite = `#fff`
export const colorGrey1 = `#F9F9FA`
export const colorGrey2 = `#F1F1F5`
export const colorGrey3 = `#E2E2EA`
export const colorGrey9 = `#281C34`

// Themes. Passed to the ThemeProvider currently only on the Tag Picket

export const lightTheme = {
    background: '#fff',
    searchBackground: colorGrey2,
    searchIcon: colorGrey9,
    text: colorDarkText,
    tag: {
        tag: colorBlue,
        hover: colorBlue,
        selected: lighten(0.18, colorBlue),
        text: darken(0.5, desaturate(0.5, colorBlue)),
    },
}

export const darkTheme = {
    background: colorGrey9,
    searchBackground: colorGrey9,
    searchIcon: colorGrey1,
    text: colorGrey1,
    tag: {
        tag: colorBlue,
        hover: colorBlue,
        selected: lighten(0.18, colorBlue),
        text: darken(0.5, desaturate(0.5, colorBlue)),
    },
}
