import { slide as SlideSidebar } from 'react-burger-menu'
import menuStyles from 'src/sidebar-annotations/components/menu-styles'
import * as React from 'react'
import { AnnotationsSidebarProps } from 'src/sidebar-annotations/components/sidebar'

interface Props {
    closeSidebar: () => void
}

interface State {
    isOpen: boolean
}

type SidebarSliderProps = Props & AnnotationsSidebarProps

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
            <SlideSidebar
                isOpen={this.state.isOpen}
                width={450}
                styles={menuStyles(this.state.isOpen)}
                right
                noOverlay
                customOnKeyDown={this.handleSidebarKeyDown}
            ></SlideSidebar>
        )
    }
}
