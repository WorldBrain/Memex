import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Header from './Header'
import DeleteConfirmation from './DeleteConfirmation'
import styles from './Overview.css'
import Filters from './Filters'

const showFilterClass = showFilter =>
    classNames({
        [styles.filtersContainer]: true,
        [styles.hideFilter]: !showFilter,
    })
const Overview = props => [
    <Header key="head" {...props} />,
    <div className={showFilterClass(props.showFilter)} key="filters">
        <Filters
            showOnlyBookmarks={props.showOnlyBookmarks}
            onShowOnlyBookmarksChange={props.onShowOnlyBookmarksChange}
        />
    </div>,
    <div
        key="body"
        className={styles.main}
        style={{ marginTop: props.showFilter ? '180px' : '100px' }}
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
