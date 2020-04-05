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
        top: '55px',
        opacity: '0',
        marginLeft: '0px',
        transition: 'all 0.1s cubic-bezier(0.65, 0.05, 0.36, 1)',
        // boxShadow:
        //     'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px',
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
        ;((baseStyles.bmMenuWrap.background as unknown) as string) = '#edf0f4'
        ;((baseStyles.bmMenuWrap.marginLeft as unknown) as string) = '0px'
        ;((baseStyles.bmMenuWrap.opacity as unknown) as string) = '1'
    }

    return baseStyles
}

export default menuStyles
