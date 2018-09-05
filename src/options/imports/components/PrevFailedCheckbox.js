import React from 'react'
import PropTypes from 'prop-types'

import styles from './AdvSettings.css'

const PrevFailedCheckbox = props => (
    <React.Fragment>
        <label htmlFor="process-failed">Include previously failed urls</label>
        <input
            className={styles.prevFailedCheckbox}
            id="process-failed"
            type="checkbox"
            {...props}
        />
    </React.Fragment>
)

PrevFailedCheckbox.propTypes = {
    checked: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
}

export default PrevFailedCheckbox
