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

// Shades of grey listed in Notion (design / colours). Scale to be from 1-10 from light to dark
export const colorWhite = `#fff`
export const colorGrey1 = `#F9F9FA`
export const colorGrey2 = `#F1F1F5`
export const colorGrey3 = `#E2E2EA`
export const colorGrey4 = `#DADBE7`
export const colorGrey5 = `#CECED9`
export const colorGrey6 = `#9B9BAA`
export const colorGrey7 = `#72727F`
export const colorGrey8 = `#4D4754`
export const colorGrey9 = `#3A2F45`
export const colorGrey10 = `#281C34`

// Themes. Passed to the ThemeProvider currently only on the Tag Picket
export const lightTheme = {
    background: '#fff',
    inputBackground: colorGrey2,
    text: colorDarkText,
    border: colorGrey2,
    tag: {
        tag: colorBlue,
        searchIcon: colorGrey8,
        hover: colorBlue,
        selected: lighten(0.18, colorBlue),
        text: darken(0.5, desaturate(0.5, colorBlue)),
        icon: colorGrey6,
        iconHover: colorGrey8,
        iconHoverBg: colorGrey4,
    },
}

export const darkTheme = {
    background: colorGrey10,
    inputBackground: colorGrey9,
    searchIcon: colorGrey3,
    text: colorGrey3,
    tag: {
        tag: colorBlue,
        hover: colorBlue,
        selected: lighten(0.18, colorBlue),
        text: darken(0.5, desaturate(0.5, colorBlue)),
        shade: colorGrey9,
        subtleIcon: colorGrey6,
        hoverIcon: colorGrey1,
    },
}
