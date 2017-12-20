import React from 'react'
import PropTypes from 'prop-types'

import { Wrapper } from 'src/common-ui/components'

import styles from './AdvSettings.css'

const PrevFailedCheckbox = props => (
    <Wrapper>
        <label htmlFor="process-failed">Include previously failed urls</label>
        <input
            className={styles.prevFailedCheckbox}
            id="process-failed"
            type="checkbox"
            {...props}
        />
    </Wrapper>
)

PrevFailedCheckbox.propTypes = {
    checked: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
}

export default PrevFailedCheckbox
