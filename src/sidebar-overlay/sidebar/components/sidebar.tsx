import * as React from 'react'
import Menu from 'react-burger-menu/lib/menus/slide'

import CongratsMessage from '../../components/CongratsMessage'
import menuStyles from './menu-styles'
import CloseButton from '../../components'

const styles = require('./sidebar.css')

interface Props {
    isOpen: boolean
    toggleSidebar: () => void
}

/* tslint:disable-next-line variable-name */
const Sidebar = (props: Props) => {
    const { toggleSidebar } = props

    return (
        <Menu
            isOpen={props.isOpen}
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
                    toggleSidebar()
                }}
            />
            <div className={styles.sidebar} id="memex-sidebar-panel">
                <div className={styles.separator} />
            </div>
        </Menu>
    )
}

export default Sidebar
