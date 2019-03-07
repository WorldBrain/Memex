// Styles for react-burger-menu.

const baseStyles = {
    bmMenuWrap: {
        top: 0,
        right: '-60px',
        transition: 'all 0.3s cubic-bezier(0.65, 0.05, 0.36, 1) 0s',
    },
    bmMenu: {
        position: 'fixed',
        right: '0px',
        top: 0,
        zIndex: 1100,
        width: '400px',
        height: '100%',
        transition: 'all 0.3s cubic-bezier(0.65, 0.05, 0.36, 1) 0s',
        boxShadow: 'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px',
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
        ;((baseStyles.bmMenuWrap.top as unknown) as string) = '0px'
    }

    return baseStyles
}

export default menuStyles
