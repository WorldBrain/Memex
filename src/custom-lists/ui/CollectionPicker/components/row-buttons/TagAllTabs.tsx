import { ListAllTabsButton } from 'src/custom-lists/ui/CollectionPicker/components/ListRow'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import React from 'react'

export const ListAllTabs = (props: { onClick: () => void }) => (
    <ButtonTooltip tooltipText="Add all tabs in window to list" position="left">
        <ListAllTabsButton size={20} onClick={props.onClick} />
    </ButtonTooltip>
)
