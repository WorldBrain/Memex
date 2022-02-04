import React from 'react'
import { Checkbox, CheckboxToggle } from 'src/common-ui/components'
import { ButtonTooltip } from 'src/common-ui/components'

import Button from './Button'
import ToggleSwitch from './ToggleSwitch'

const styles = require('./ToggleSwitchButton.css')

export interface Props {
    isEnabled: boolean
    toggleHoverText?: any
    contentType?: 'pages' | 'PDFs'
    onToggleClick: CheckboxToggle
}

export const ToggleSwitchButton = (props: Props) => (
    <div className={styles.switchBlocks}>
        <ButtonTooltip tooltipText={props.toggleHoverText} position="leftBig">
            <Checkbox
                isChecked={props.isEnabled}
                handleChange={props.onToggleClick}
                mode={'radio'}
                size={20}
            />
        </ButtonTooltip>
    </div>
)
