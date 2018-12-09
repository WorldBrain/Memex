import React from 'react'
import PropTypes from 'prop-types'
import Menu from 'react-burger-menu/lib/menus/slide'

import CommentBox from '../CommentBox'
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
                {props.showCongratsMessage && (
                    <div className={styles.congrats}>
                        {/* <img src /> */}
                        <p className={styles.title}>
                            CONGRATS TO YOUR FIRST ANNOTATION
                        </p>
                        <div className={styles.learnMore}>
                            Learn more about the sidebar
                        </div>
                        <p>or go back to dashboard</p>
                    </div>
                )}
            </div>
        </div>
    </Menu>
)

Sidebar.propTypes = {
    showSidebar: PropTypes.bool.isRequired,
    showCongratsMessage: PropTypes.bool.isRequired,
    handleStateChange: PropTypes.func.isRequired,
    renderAnnotations: PropTypes.func.isRequired,
    toggleMouseOnSidebar: PropTypes.func.isRequired,
    updateAnnotations: PropTypes.func.isRequired,
    env: PropTypes.string.isRequired,
}

export default Sidebar
