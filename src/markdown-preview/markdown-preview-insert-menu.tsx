import React from 'react'
import styled from 'styled-components'

import { DropdownMenuBtn } from 'src/common-ui/components/dropdown-menu-btn'
import { getTextInsertedAtInputSelection } from 'src/util/input-utils'
import {
    MarkdownPreview,
    Props as MarkdownPreviewProps,
} from './markdown-preview'
import { MenuItemProps } from './types'
import { annotationMenuItems } from './insert-menu-entries'

export interface Props extends MarkdownPreviewProps {
    menuItems?: MenuItemProps[]
    updateInputValue: (value: string) => void
}

export class MarkdownPreviewAnnotationInsertMenu extends React.PureComponent<
    Props
> {
    static defaultProps: Partial<Props> = {
        menuItems: annotationMenuItems,
    }

    markdownPreviewRef = React.createRef<MarkdownPreview>()

    private focusMainInput() {
        const input = this.markdownPreviewRef.current.mainInputRef.current

        // TODO: keep the selection state on input blur and focus back to here
        input.focus()
    }

    private handleItemClick = ({
        getTextToInsert,
        isDisabled,
    }: MenuItemProps) => {
        const newValue = getTextInsertedAtInputSelection(
            getTextToInsert(),
            this.markdownPreviewRef.current.mainInputRef.current,
        )

        this.props.updateInputValue(newValue)
        this.focusMainInput()
    }

    private renderInsertMenu = () => (
        <DropdownMenuContainer>
            <DropdownMenuBtn
                onMenuItemClick={this.handleItemClick}
                menuItems={this.props.menuItems}
                btnChildren="Insert"
                btnId="DropdownMenuBtn"
            />
        </DropdownMenuContainer>
    )

    render() {
        return (
            <MarkdownPreview
                ref={this.markdownPreviewRef}
                {...this.props}
                renderSecondaryBtn={this.renderInsertMenu}
            />
        )
    }
}

const DropdownMenuContainer = styled.div`
    & #DropdownMenuBtn {
        padding: 2px 6px;
    }
`
