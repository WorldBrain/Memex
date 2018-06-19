import React from 'react'
import PropTypes from 'prop-types'
import Menu from 'react-burger-menu/lib/menus/slide'

import CommentBox from './CommentBox'
import styles from './Sidebar.css'
import MenuStyles from './MenuStyles.js'

const Sidebar = ({
    showSidebar,
    handleStateChange,
    renderAnnotations,
    saveComment,
    toggleMouseOnSidebar,
    env,
}) => (
    <Menu
        isOpen={showSidebar}
        onStateChange={handleStateChange}
        width={340}
        styles={MenuStyles(env)}
        right
        noOverlay
    >
        <div
            className={styles.sidebar}
            onMouseEnter={toggleMouseOnSidebar}
            onMouseLeave={toggleMouseOnSidebar}
        >
            {showSidebar ? <CommentBox saveComment={saveComment} /> : null}

            <div className={styles.annotationContainer}>
                {renderAnnotations()}
            </div>
        </div>
    </Menu>
)

Sidebar.propTypes = {
    showSidebar: PropTypes.bool.isRequired,
    handleStateChange: PropTypes.func.isRequired,
    renderAnnotations: PropTypes.func.isRequired,
    saveComment: PropTypes.func.isRequired,
    toggleMouseOnSidebar: PropTypes.func.isRequired,
    env: PropTypes.string.isRequired,
}

export default Sidebar
