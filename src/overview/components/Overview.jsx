import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Wrapper } from 'src/common-ui/components'
import DeleteConfirmModal from './DeleteConfirmModal'
import Header from './Header'
import styles from './Overview.css'
import Tooltip from './Tooltip'
import Head from 'src/options/containers/Head'
import Sidebar from './Sidebar'

const showFilterClass = ({ showFilters }) =>
    classNames({
        [styles.filtersContainer]: true,
        [styles.hideFilter]: !showFilters,
    })

const Overview = props => (
    <Wrapper>
        <Head />
        <Header {...props} />

        <Tooltip
            showTooltip={props.showTooltip}
            toggleShowTooltip={props.toggleShowTooltip}
            tooltip={props.tooltip}
            fetchNextTooltip={props.fetchNextTooltip}
            isTooltipRenderable={props.isTooltipRenderable}
        />

        <Sidebar />

        <div className={showFilterClass(props)}>{props.filters}</div>
        <div
            className={styles.main}
            style={{
                marginTop: props.showFilters ? '180px' : '100px',
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
    showFilters: PropTypes.bool.isRequired,
    filters: PropTypes.node.isRequired,
    showTooltip: PropTypes.bool.isRequired,
    toggleShowTooltip: PropTypes.func.isRequired,
    tooltip: PropTypes.object,
    fetchNextTooltip: PropTypes.func.isRequired,
    isTooltipRenderable: PropTypes.bool.isRequired,
}

export default Overview
