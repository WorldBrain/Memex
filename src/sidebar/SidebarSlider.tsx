import * as React from 'react'

interface Props {
    closeSidebar: () => void
    children: any
}

interface State {
    isOpen: boolean
}

type SidebarSliderProps = Props

export class SidebarSlider extends React.Component<SidebarSliderProps, State> {
    private closeSidebar = () => {
        this.setState({ isOpen: false })
    }

    render() {
        return null
    }
}

// Styles for react-burger-menu.
const baseStyles = {
    bmMenuWrap: {
        top: '0px',
        right: '0px',
        zIndex: '3500',
        transition: 'all 0.1s cubic-bezier(0.65, 0.05, 0.36, 1)',
        width: '450px',
    },
    bmMenu: {
        zIndex: '2147483646',
        overflowY: 'hidden',
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
        display: 'none',
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
