import { slide as Slider, Styles as SliderStyles } from 'react-burger-menu'
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

    private handleSidebarKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            this.closeSidebar()
        }
    }

    render() {
        return (
            <Slider
                isOpen={this.state.isOpen}
                width={450}
                styles={menuStyles(this.state.isOpen)}
                right
                noOverlay
                customOnKeyDown={this.handleSidebarKeyDown}
            >
                {this.props.children}
            </Slider>
        )
    }
}

// Styles for react-burger-menu.
const baseStyles = {
    bmMenuWrap: {
        top: '0px',
        right: '0px',
        zIndex: '2147483644',
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

const menuStyles = (isOpen): Partial<SliderStyles> => {
    if (isOpen) {
        ;((baseStyles.bmMenu.opacity as unknown) as string) = '1'
        ;((baseStyles.bmMenu.background as unknown) as string) = '#fff'
        ;((baseStyles.bmItem.display as unknown) as string) = 'block'
        ;((baseStyles.bmMenuWrap.right as unknown) as string) = '35px'
    } else {
        ;((baseStyles.bmMenu.opacity as unknown) as string) = '0'
        ;((baseStyles.bmMenu.background as unknown) as string) = 'transparent'
        ;((baseStyles.bmItem.display as unknown) as string) = 'none'
    }

    return baseStyles
}
