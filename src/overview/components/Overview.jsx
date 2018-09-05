import React from 'react'
import PropTypes from 'prop-types'

import DeleteConfirmModal from './DeleteConfirmModal'
import Header from './Header'
import styles from './Overview.css'
import Head from 'src/options/containers/Head'
import SideBar from '../sidebar-left/container'

const Overview = props => (
    <React.Fragment>
        <Head />
        <Header {...props} />

        {props.sidebarIcons}
        <SideBar disableOnClickOutside={props.disbleOutsideClick} />

        <div className={styles.main}>{props.children}</div>
        <DeleteConfirmModal
            isShown={props.isDeleteConfShown}
            onClose={props.resetDeleteConfirm}
            deleteDocs={props.deleteDocs}
        />
        {props.renderDragElement}
    </React.Fragment>
)

Overview.propTypes = {
    children: PropTypes.node.isRequired,
    isDeleteConfShown: PropTypes.bool.isRequired,
    resetDeleteConfirm: PropTypes.func.isRequired,
    deleteDocs: PropTypes.func.isRequired,
    renderDragElement: PropTypes.node.isRequired,
    sidebarIcons: PropTypes.node,
    disbleOutsideClick: PropTypes.bool.isRequired,
}

export default Overview
