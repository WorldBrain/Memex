import { TagAllTabsButton } from 'src/tags/ui/TagPicker/components/TagRow'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import React from 'react'

export const TagAllTabs = (props: { onClick: () => void }) => (
    <ButtonTooltip tooltipText="Tag all tabs in window" position="left">
        <TagAllTabsButton size={20} onClick={props.onClick} />
    </ButtonTooltip>
)
