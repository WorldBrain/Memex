import colors from './colors'

export const fonts = {
    primary: {
        name: 'Poppins',
        colors: {
            primary: colors.fonts.primary,
            secondary: colors.fonts.secondary,
        },
        weight: {
            normal: 'normal',
            bold: 700,
        },
    },
}

const styleConstants = {
    fonts,
    components: {
        dropDown: {
            boxShadow: '0px 0px 4.20px rgba(0, 0, 0, 0.14)',
            borderRadius: '2.1px',
        },
    },
}

export default styleConstants
