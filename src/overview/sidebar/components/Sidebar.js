import React from 'react'
import PropTypes from 'prop-types'
import Menu from 'react-burger-menu/lib/menus/slide'

import { CommentBox } from 'src/common-ui/components'
import styles from './Sidebar.css'

// Styles for react-burger-menu
const extraStyles = {
    bmMenuWrap: {
        top: 0,
    },
    bmMenu: {
        position: 'fixed',
        right: 0,
        top: '100px',
        zIndex: 1100,
        width: '340px',
        height: '100%',
        marginTop: '-25px',
        transition: 'all 0.5s',
        boxShadow: '-4px 2px 20px 1px rgba(62, 185, 149, 0.0902)',
    },
    bmBurgerButton: {
        width: 0,
        height: 0,
        display: 'none',
    },
}

const Sidebar = ({ showSidebar, handleStateChange }) => (
    <Menu
        isOpen={showSidebar}
        onStateChange={handleStateChange}
        width={340}
        styles={extraStyles}
        right
        noOverlay
    >
        <div className={styles.sidebar}>
            <p className={styles.sidebarTitle}>Highlights</p>
            <CommentBox comment={undefined} />
        </div>
    </Menu>
)

Sidebar.propTypes = {
    showSidebar: PropTypes.bool.isRequired,
    handleStateChange: PropTypes.func.isRequired,
}

export default Sidebar
