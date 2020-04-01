// Styles for react-burger-menu.

const baseStyles = {
    bmMenuWrap: {
        top: 0,
        right: '-60px',
        zIndex: 2147483644,
        transition: 'all 0.1s cubic-bezier(0.65, 0.05, 0.36, 1)',
    },
    bmMenu: {
        position: 'fixed',
        right: '30px',
        top: '0px',
        zIndex: 2147483646,
        overflowY: 'hidden',
        width: '450px',
        opacity: '1',
        height: '100%',
        background: '#fff',
        boxShadow:
            'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px',
    },
    bmBurgerButton: {
        display: 'none',
    },
    bmCrossButton: {
        display: 'none',
    },
    bmItem: {
        display: 'block',
        overflowY: 'scroll',
        flex: '1',
        overflowX: 'hidden',
        width: '101%,',
    },
    bmItemList: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        overflow: 'hidden',
    },
}

const menuStyles = (env, isOpen) => {
    if (env === 'overview') {
        ;((baseStyles.bmMenu.top as unknown) as string) = '55px'
        ;((baseStyles.bmMenuWrap.top as unknown) as string) = '0px'
        ;((baseStyles.bmMenu.right as unknown) as string) = '0px'
        ;((baseStyles.bmMenuWrap.zIndex as unknown) as string) = '999'
    }

    if (isOpen) {
        ;((baseStyles.bmMenu.opacity as unknown) as string) = '1'
        ;((baseStyles.bmMenu.background as unknown) as string) = '#fff'
    } else {
        ;((baseStyles.bmMenu.opacity as unknown) as string) = '0'
        ;((baseStyles.bmMenu.background as unknown) as string) = 'transparent'
    }

    return baseStyles
}

export default menuStyles
