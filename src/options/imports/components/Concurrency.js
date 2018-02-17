import React from 'react'
import PropTypes from 'prop-types'

import { Wrapper } from 'src/common-ui/components'

import styles from './AdvSettings.css'

const Concurrency = ({ concurrency, onConcurrencyChange }) => (
    <Wrapper>
        <label htmlFor="concurrency">
            # of simultaneous downloads (max. 20)
        </label>
        <input
            className={styles.concurrencyInput}
            id="concurrency"
            onChange={onConcurrencyChange}
            value={concurrency}
            type="number"
            min="1"
            max="20"
        />
    </Wrapper>
)

Concurrency.propTypes = {
    concurrency: PropTypes.number.isRequired,
    onConcurrencyChange: PropTypes.func.isRequired,
}

export default Concurrency
