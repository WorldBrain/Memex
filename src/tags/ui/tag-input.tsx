import * as React from 'react'

import TagPicker from 'src/tags/ui/TagPicker'
import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'
import TagHolder from './tag-holder'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import { LesserLink } from 'src/common-ui/components/design-library/actions/LesserLink'
import styled from 'styled-components'
import { Link } from 'src/common-ui/components/design-library/actions/Link'
import { ButtonTooltip } from 'src/common-ui/components'

export interface Props {
    queryTagSuggestions: (query: string) => Promise<string[]>
    fetchInitialTagSuggestions: () => string[] | Promise<string[]>
    setTagInputActive: (isTagInputActive: boolean) => void
    deleteTag: (tag: string) => void
    updateTags: PickerUpdateHandler
    onKeyDown?: React.KeyboardEventHandler
    handleClose: React.MouseEventHandler
    isTagInputActive: boolean
    tags: string[]
}

class TagInput extends React.Component<Props> {
    private renderTagPicker() {
        if (!this.props.isTagInputActive) {
            return null
        }

        return (
            <HoverBox>
                <TagPicker
                    onUpdateEntrySelection={this.props.updateTags}
                    queryEntries={this.props.queryTagSuggestions}
                    loadDefaultSuggestions={
                        this.props.fetchInitialTagSuggestions
                    }
                    initialSelectedEntries={async () => this.props.tags}
                    onEscapeKeyDown={() => this.props.setTagInputActive(false)}
                    onClickOutside={(e) => this.props.handleClose(e)}
                />
            </HoverBox>
        )
    }

    private handleTagHolderClick = (e) => {
        this.props.setTagInputActive(!this.props.isTagInputActive)
    }

    render() {
        return (
            <div onKeyDown={(e) => this.props.onKeyDown?.(e)}>
                <TagHolder
                    clickHandler={this.handleTagHolderClick}
                    {...this.props}
                />
                {this.renderTagPicker()}
            </div>
        )
    }
}

const LesserLinkStyled = styled(LesserLink)``

const TopRow = styled.div`
    display: flex;
    justify-content: center;
    flex: 1;
    margin: 4px 4px 0 4px;
    cursor: pointer;

    &:hover {
        background-color: #e0e0e0;
    }

    & span {
        font-family: sans-serif;
    }
`

export default TagInput
