import React from 'react'
import PropTypes from 'prop-types'

import { Wrapper } from 'src/common-ui/components'
import DeleteConfirmModal from './DeleteConfirmModal'
import Header from './Header'
import styles from './Overview.css'
import Head from 'src/options/containers/Head'
import SideBar from '../sidebar-left/container'

const Overview = props => (
    <Wrapper>
        <div onDrop={props.resetUrlDragged}>
            <Head />
            <Header {...props} />

            {props.sidebarIcons}
            <SideBar
                disableOnClickOutside={Boolean(props.urlDragged)}
            // disableOnClickOutside={true}
            />
            <div className={styles.main}>{props.children}</div>
            <DeleteConfirmModal
                isShown={props.isDeleteConfShown}
                onClose={props.resetDeleteConfirm}
                deleteDocs={props.deleteDocs}
            />
            {props.renderDragElement}
        </div>
    </Wrapper>
)

Overview.propTypes = {
    children: PropTypes.node.isRequired,
    isDeleteConfShown: PropTypes.bool.isRequired,
    resetDeleteConfirm: PropTypes.func.isRequired,
    deleteDocs: PropTypes.func.isRequired,
    renderDragElement: PropTypes.node.isRequired,
    sidebarIcons: PropTypes.node.isRequired,
    urlDragged: PropTypes.string.isRequired,
    resetUrlDragged: PropTypes.func.isRequired,
}

export default Overview
