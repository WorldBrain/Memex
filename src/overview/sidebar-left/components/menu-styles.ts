const baseStyles = {
    bmBurgerButton: {
        position: 'fixed',
    },
    bmCrossButton: {
        display: 'none',
    },
    bmMenu: {
        overflow: 'hidden',
    },
    bmMenuWrap: {
        position: 'fixed',
        right: 'inherit',
        zIndex: '1100',
        width: '250px',
        height: '90vh',
        top: '55px',
        transition: 'all 0.3s cubic-bezier(0.65, 0.05, 0.36, 1) 0s',
        borderTopRightRadius: '6px',
        borderBottomRightRadius: '6px',
        // boxShadow:
        //     'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px',
        fontSize: '0.68rem',
        background: 'rgb(255, 255, 255)',
    },
}

const menuStyles = (isSidebarLocked: boolean) => {
    ;((baseStyles.bmMenuWrap.background as unknown) as string) = isSidebarLocked
        ? '#edf0f4'
        : '#fff'

    return baseStyles
}

export default menuStyles
