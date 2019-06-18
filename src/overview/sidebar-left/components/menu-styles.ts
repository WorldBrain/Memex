const baseStyles = {
    bmBurgerButton: {
        position: 'fixed',
    },
    bmCrossButton: {
        display: 'none',
    },
    bmMenu: {
        overflowY: 'hidden',
    },
    bmMenuWrap: {
        position: 'fixed',
        right: 'inherit',
        zIndex: '1100',
        height: '100vh',
        width: '250px',
        paddingTop: '55px',
        opacity: '1',
        marginLeft: '0px',
        transition: 'all 0.2s cubic-bezier(0.65, 0.05, 0.36, 1) 0s',
        fontSize: '0.68rem',
        background: 'rgb(255, 255, 255)',
    },
}

const menuStyles = (isSidebarLocked, isSidebarOpen) => {
    if (isSidebarOpen) {
        ;((baseStyles.bmMenuWrap.marginLeft as unknown) as string) = '0px'
        ;((baseStyles.bmMenuWrap.opacity as unknown) as string) = '1'
        ;((baseStyles.bmMenuWrap
            .background as unknown) as string) = 'transparent'
    } else {
        ;((baseStyles.bmMenuWrap.marginLeft as unknown) as string) = '-230px'
        ;((baseStyles.bmMenuWrap.opacity as unknown) as string) = '0'
        ;((baseStyles.bmMenuWrap
            .background as unknown) as string) = 'transparent'
    }

    if (isSidebarLocked) {
        ;((baseStyles.bmMenuWrap.marginLeft as unknown) as string) = '0px'
        ;((baseStyles.bmMenuWrap.opacity as unknown) as string) = '1'
    }

    return baseStyles
}

export default menuStyles
