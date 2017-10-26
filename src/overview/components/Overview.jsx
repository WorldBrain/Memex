import React from 'react'
import PropTypes from 'prop-types'

import Header from './Header'
import DeleteConfirmation from './DeleteConfirmation'
import styles from './Overview.css'
import Filters from './Filters'

const Overview = props => [
    <Header key="head" {...props} />,
    <div className={styles.filtersContainer}>
        {props.showFilter && (
            <Filters
                showOnlyBookmarks={props.showOnlyBookmarks}
                onShowOnlyBookmarksChange={props.onShowOnlyBookmarksChange}
            />
        )}
    </div>,
    <div
        key="body"
        className={styles.main}
        style={{ marginTop: props.showFilter ? '200px' : '100px' }}
    >
        {props.children}
    </div>,
    <DeleteConfirmation
        key="delete-modal"
        isShown={props.isDeleteConfShown}
        close={props.hideDeleteConfirm}
        deleteDocs={props.deleteDocs}
    />,
]

Overview.propTypes = {
    children: PropTypes.node.isRequired,
    isDeleteConfShown: PropTypes.bool.isRequired,
    hideDeleteConfirm: PropTypes.func.isRequired,
    deleteDocs: PropTypes.func.isRequired,
    onShowFilterChange: PropTypes.func.isRequired,
    showFilter: PropTypes.bool.isRequired,
    showOnlyBookmarks: PropTypes.bool.isRequired,
    onShowOnlyBookmarksChange: PropTypes.func.isRequired,
}

export default Overview
