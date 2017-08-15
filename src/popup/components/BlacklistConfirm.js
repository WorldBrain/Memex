import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './BlacklistConfirm.css'

const BlacklistConfirm = props => (
    <div className={styles.container}>
        <h1 className={styles.header}>Blacklisting successful!</h1>
        <p className={styles.content}>Do you want to delete all past visits as well?</p>
        <div className={styles.btnBar}>
            <button className={cx(styles.btn, styles.btnDanger)} onClick={props.onConfirmClick}>YES</button>
            <button className={styles.btn} onClick={props.onDenyClick}>NO</button>
        </div>
    </div>
)

BlacklistConfirm.propTypes = {
    onConfirmClick: PropTypes.func.isRequired,
    onDenyClick: PropTypes.func.isRequired,
}

export default BlacklistConfirm
