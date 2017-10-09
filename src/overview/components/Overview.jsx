import React from 'react'
import PropTypes from 'prop-types'

import Header from './Header'
import DeleteConfirmation from './DeleteConfirmation'
import styles from './Overview.css'

const Overview = props => [
    <Header key='head' {...props} />,
    <div key='body' className={styles.main}>
        {props.children}
        <DeleteConfirmation
            isShown={props.isDeleteConfShown}
            close={props.hideDeleteConfirm}
            deleteDocs={props.deleteDocs}
        />
    </div>,
]

Overview.propTypes = {
    children: PropTypes.node.isRequired,
    isDeleteConfShown: PropTypes.bool.isRequired,
    hideDeleteConfirm: PropTypes.func.isRequired,
    deleteDocs: PropTypes.func.isRequired,
}

export default Overview
