// Styles for react-burger-menu.

const baseStyles = {
    bmMenuWrap: {
        top: 0,
        transition: 'all 0s',
    },
    bmMenu: {
        position: 'fixed',
        right: 0,
        top: 0,
        zIndex: 1100,
        width: '340px',
        height: '100%',
        transition: 'all 0s',
        boxShadow: '-4px 2px 20px 1px rgba(62, 185, 149, 0.0902)',
    },
    bmBurgerButton: {
        display: 'none',
    },
    bmCrossButton: {
        display: 'none',
    },
}

const menuStyles = (env: 'inpage' | 'overview') => {
    if (env === 'overview') {
        ;((baseStyles.bmMenu.top as unknown) as string) = '55px'
        ;((baseStyles.bmMenuWrap.top as unknown) as string) = '55px'
        baseStyles.bmMenu.transition = 'all 0s'
        baseStyles.bmMenuWrap.transition = 'all 0s'
    }

    return baseStyles
}

export default menuStyles
