import React from 'react'
import PropTypes from 'prop-types'

import styles from './Button.css'

const SplitButton = ({ icon, children }) => (
    <div className={styles.item}>
        {icon && <i className='material-icons'>{icon}</i>}
        <div className={styles.splitBtn}>
            {children}
        </div>
    </div>
)

SplitButton.propTypes = {
    icon: PropTypes.string,
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default SplitButton
