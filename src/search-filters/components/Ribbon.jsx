import React from 'react'
import cx from 'classnames'
import PropTypes from 'prop-types'

import styles from './Ribbon.css'

const Ribbon = props => (
    <div className={styles.ribbon}>
        <div className={styles.buttonContainer}>
            <button
                className={cx(styles.editButton, styles.button)}
                onClick={props.tickBtnClick}
            />
            <button
                className={cx(styles.deleteButton, styles.button)}
                onClick={() => {
                    console.log('gg')
                }}
            />
        </div>
    </div>
)

Ribbon.propTypes = {
    tickBtnClick: PropTypes.func.isRequired,
}

export default Ribbon
