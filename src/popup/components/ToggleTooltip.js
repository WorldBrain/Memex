import React from 'react'
import PropTypes from 'prop-types'

import Button from './Button'
import ToggleSwitch from './ToggleSwitch'
import { OutLink } from 'src/common-ui/containers'
import { INFO_URL } from 'src/content-tooltip/constants'

import styles from './ToggleTooltip.css'
import buttonStyles from './Button.css'

const ToggleTooltip = ({ isChecked, handleChange }) => (
    <div className={styles.toggleDiv}>
        <Button
            onClick={handleChange}
            icon="link"
            btnClass={buttonStyles.linkIcon}
        >
            <span>
                Memex.Link Tooltip
                <ToggleSwitch isChecked={isChecked} onChange={handleChange} />
            </span>
        </Button>
        <OutLink className={styles.infoLink} href={INFO_URL} tabIndex="-1" />
    </div>
)

ToggleTooltip.propTypes = {
    isChecked: PropTypes.bool.isRequired,
    handleChange: PropTypes.func.isRequired,
}
export default ToggleTooltip
