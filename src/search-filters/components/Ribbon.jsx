import React from 'react'
import cx from 'classnames'

import styles from './Ribbon.css'

const Ribbon = props => (
    <div className={styles.ribbon}>
        <div className={styles.buttonContainer}>
            <button
                className={cx(styles.editButton, styles.button)}
                onClick={() => {
                    console.log('dd')
                }}
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

export default Ribbon
