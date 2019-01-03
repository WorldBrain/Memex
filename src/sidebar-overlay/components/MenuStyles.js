// Styles for react-burger-menu

const baseStyles = {
    bmMenuWrap: {
        top: 0,
        transition: 'all 0s',
    },
    bmMenu: {
        position: 'fixed',
        right: 0,
        top: '81px',
        zIndex: 1100,
        width: '340px',
        height: '100%',
        marginTop: '-25px',
        transition: 'all 0s',
        boxShadow: '-4px 2px 20px 1px rgba(62, 185, 149, 0.0902)',
    },
    bmBurgerButton: {
        width: 0,
        height: 0,
        display: 'none',
    },
    bmOverlay: {
        top: '71px',
        left: 0,
    },
}

const MenuStyles = env => {
    if (env === 'iframe') {
        baseStyles.bmMenu.top = 0
        baseStyles.bmMenu.marginTop = 0
        baseStyles.bmMenu.transition = 'all 0s'
        baseStyles.bmMenuWrap.transition = 'all 0s'
    }
    return baseStyles
}

export default MenuStyles
