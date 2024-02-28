import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import React from 'react'
import Checkbox, { CheckboxToggle } from 'src/common-ui/components/Checkbox'

export interface Props {
    isEnabled: boolean
    toggleHoverText?: any
    contentType?: 'pages' | 'PDFs'
    onToggleClick: CheckboxToggle
    getRootElement: () => HTMLElement
}

export const ToggleSwitchButton = (props: Props) => (
    <div>
        {!props.toggleHoverText ? (
            <Checkbox
                isChecked={props.isEnabled}
                handleChange={props.onToggleClick}
                size={20}
            />
        ) : (
            <TooltipBox
                tooltipText={props.toggleHoverText}
                placement="left"
                getPortalRoot={props.getRootElement}
            >
                <Checkbox
                    isChecked={props.isEnabled}
                    handleChange={props.onToggleClick}
                    size={20}
                />
            </TooltipBox>
        )}
    </div>
)
