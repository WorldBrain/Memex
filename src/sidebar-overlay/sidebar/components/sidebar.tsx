import * as React from 'react'
import Menu from 'react-burger-menu/lib/menus/slide'

import CongratsMessage from '../../components/CongratsMessage'
import menuStyles from './menu-styles'

const styles = require('./sidebar.css')

interface Props {
    isOpen: boolean
}

/* tslint:disable-next-line variable-name */
const Sidebar = (props: Props) => (
    <Menu
        isOpen={props.isOpen}
        width={340}
        styles={menuStyles}
        right
        noOverlay
        disableCloseOnEsc
    >
        <div className={styles.sidebar} id="memex-sidebar-panel">
            <div className={styles.separator} />
        </div>
    </Menu>
)

export default Sidebar
