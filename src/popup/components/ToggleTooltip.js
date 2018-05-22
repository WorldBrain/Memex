import React from 'react'
import PropTypes from 'prop-types'

import Button from './Button'
import { ToggleSwitch } from 'src/common-ui/components'
import styles from './Button.css'

const ToggleTooltip = ({ isChecked, handleChange }) => (
    <div>
        <Button onClick={handleChange} icon="link" btnClass={styles.linkIcon}>
            <span>
                Memex.Link Tooltip
                <ToggleSwitch
                    className={styles.tooltipToggle}
                    activeClassName={styles.activeToggle}
                    isChecked={isChecked}
                    onChange={handleChange}
                />
            </span>
        </Button>
    </div>
)

ToggleTooltip.propTypes = {
    isChecked: PropTypes.bool.isRequired,
    handleChange: PropTypes.func.isRequired,
}
export default ToggleTooltip
