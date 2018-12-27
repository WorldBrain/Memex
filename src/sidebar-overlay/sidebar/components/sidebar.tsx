import * as React from 'react'
import Menu from 'react-burger-menu/lib/menus/slide'

import CongratsMessage from '../../components/CongratsMessage'
import menuStyles from './menu-styles'
import CloseButton from '../../components'

const styles = require('./sidebar.css')

interface Props {
    isOpen: boolean
    closeSidebar: () => void
    handleMouseEnter: (e: Event) => void
    handleMouseLeave: (e: Event) => void
}

class Sidebar extends React.Component<Props> {
    private sidebarRef: HTMLElement

    componentDidMount() {
        this._attachEventListeners()
    }

    componentWillUnmount() {
        this._removeEventListeners()
    }

    private _attachEventListeners() {
        this.sidebarRef.addEventListener(
            'mouseenter',
            this.props.handleMouseEnter,
        )
        this.sidebarRef.addEventListener(
            'mouseleave',
            this.props.handleMouseLeave,
        )
    }

    private _removeEventListeners() {
        this.sidebarRef.removeEventListener(
            'mouseenter',
            this.props.handleMouseEnter,
        )
        this.sidebarRef.removeEventListener(
            'mouseleave',
            this.props.handleMouseLeave,
        )
    }

    private _setSidebarRef = (ref: HTMLElement) => {
        this.sidebarRef = ref
    }

    render() {
        const { isOpen, closeSidebar } = this.props

        return (
            <Menu
                isOpen={isOpen}
                width={340}
                styles={menuStyles}
                right
                noOverlay
                disableCloseOnEsc
            >
                <CloseButton
                    title="Close sidebar once. Disable via Memex icon in the extension toolbar."
                    clickHandler={e => {
                        e.stopPropagation()
                        closeSidebar()
                    }}
                />
                <div className={styles.sidebar} ref={this._setSidebarRef}>
                    <div className={styles.separator} />
                </div>
            </Menu>
        )
    }
}

export default Sidebar
