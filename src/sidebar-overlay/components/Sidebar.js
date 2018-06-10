import React from 'react'
import PropTypes from 'prop-types'
import Menu from 'react-burger-menu/lib/menus/slide'

import CommentBox from './CommentBox'
import styles from './Sidebar.css'

// Styles for react-burger-menu
const extraStyles = {
    bmMenuWrap: {
        top: 0,
    },
    bmMenu: {
        position: 'fixed',
        right: 0,
        top: '97px',
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
    bmOverlay: {
        top: '71px',
        left: 0,
    },
}

const Sidebar = ({
    showSidebar,
    handleStateChange,
    renderAnnotations,
    saveComment,
    toggleMouseOnSidebar,
}) => (
    <Menu
        isOpen={showSidebar}
        onStateChange={handleStateChange}
        width={340}
        styles={extraStyles}
        right
    >
        <div className={styles.sidebar}>
            {showSidebar ? <CommentBox saveComment={saveComment} /> : null}

            <div
                className={styles.annotationContainer}
                onMouseEnter={toggleMouseOnSidebar}
                onMouseLeave={toggleMouseOnSidebar}
            >
                {renderAnnotations()}
                <div className={styles.extraHeight} />
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
}

export default Sidebar
