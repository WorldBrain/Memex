import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Wrapper } from 'src/common-ui/components'
import DeleteConfirmModal from './DeleteConfirmModal'
import Header from './Header'
import styles from './Overview.css'
import Filters from './Filters'
import ShareButtons from './ShareButtons'

const showFilterClass = ({ showFilter }) =>
    classNames({
        [styles.filtersContainer]: true,
        [styles.hideFilter]: !showFilter,
    })

const Overview = props => (
    <Wrapper>
        <Header {...props} />
        <ShareButtons />

        <div className={showFilterClass(props)}>
            <Filters
                showOnlyBookmarks={props.showOnlyBookmarks}
                onShowOnlyBookmarksChange={props.onShowOnlyBookmarksChange}
                clearAllFilters={props.clearAllFilters}
                isClearFilterButtonShown={props.isClearFilterButtonShown}
                tagFilterManager={props.tagFilterManager}
                domainFilterManager={props.domainFilterManager}
                onFilterClick={props.onFilterClick}
                setRef={props.setRef}
                tagFilterPills={props.tagFilterPills}
                domainFilterPills={props.domainFilterPills}
            />
        </div>
        <div
            className={styles.main}
            style={{
                marginTop: props.showFilter ? '180px' : '100px',
            }}
        >
            {props.children}
        </div>
        <DeleteConfirmModal
            isShown={props.isDeleteConfShown}
            onClose={props.resetDeleteConfirm}
            deleteDocs={props.deleteDocs}
        />
    </Wrapper>
)

Overview.propTypes = {
    children: PropTypes.node.isRequired,
    isDeleteConfShown: PropTypes.bool.isRequired,
    resetDeleteConfirm: PropTypes.func.isRequired,
    deleteDocs: PropTypes.func.isRequired,
    showFilter: PropTypes.bool.isRequired,
    showOnlyBookmarks: PropTypes.bool.isRequired,
    onShowOnlyBookmarksChange: PropTypes.func.isRequired,
    clearAllFilters: PropTypes.func.isRequired,
    isClearFilterButtonShown: PropTypes.bool.isRequired,
    tagFilterManager: PropTypes.node,
    domainFilterManager: PropTypes.node,
    onFilterClick: PropTypes.func.isRequired,
    setRef: PropTypes.func.isRequired,
    tagFilterPills: PropTypes.node,
    domainFilterPills: PropTypes.node,
}

export default Overview
