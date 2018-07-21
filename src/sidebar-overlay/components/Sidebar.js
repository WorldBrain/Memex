import React from 'react'
import PropTypes from 'prop-types'
import Menu from 'react-burger-menu/lib/menus/slide'

import CommentBox from './CommentBox'
import styles from './Sidebar.css'
import MenuStyles from './MenuStyles'

const Sidebar = props => (
    <Menu
        isOpen={props.showSidebar}
        onStateChange={props.handleStateChange}
        width={340}
        styles={MenuStyles(props.env)}
        right
        noOverlay
        disableCloseOnEsc
    >
        <div
            className={styles.sidebar}
            onMouseEnter={props.toggleMouseOnSidebar}
            onMouseLeave={props.toggleMouseOnSidebar}
            id="memex_sidebar_panel"
        >
            {props.showSidebar ? (
                <CommentBox
                    env={props.env}
                    updateAnnotations={props.updateAnnotations}
                />
            ) : null}

            <div className={styles.separator} />

            <div className={styles.annotationContainer}>
                {props.renderAnnotations()}
            </div>
        </div>
    </Menu>
)

Sidebar.propTypes = {
    showSidebar: PropTypes.bool.isRequired,
    handleStateChange: PropTypes.func.isRequired,
    renderAnnotations: PropTypes.func.isRequired,
    toggleMouseOnSidebar: PropTypes.func.isRequired,
    updateAnnotations: PropTypes.func.isRequired,
    env: PropTypes.string.isRequired,
}

export default Sidebar
