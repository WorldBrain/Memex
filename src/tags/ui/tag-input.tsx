import * as React from 'react'

import TagPicker from 'src/tags/ui/TagPicker'
import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'
import TagHolder from './tag-holder'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import { LesserLink } from 'src/common-ui/components/design-library/actions/LesserLink'
import styled from 'styled-components'
import { Link } from 'src/common-ui/components/design-library/actions/Link'

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
                <TopRow>
                    <LesserLinkStyled
                        label={'Close'}
                        onClick={(e) => this.props.handleClose(e)}
                    />
                </TopRow>
                <TagPicker
                    onUpdateEntrySelection={this.props.updateTags}
                    queryEntries={this.props.queryTagSuggestions}
                    loadDefaultSuggestions={
                        this.props.fetchInitialTagSuggestions
                    }
                    initialSelectedEntries={async () => this.props.tags}
                    onEscapeKeyDown={() => this.props.setTagInputActive(false)}
                    onClickOutside={() => this.props.handleClose}
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

const LesserLinkStyled = styled(LesserLink)`
    padding-top: 5px;
    padding-right: 5px;
`

const TopRow = styled.div`
    display: flex;
    flex-direction: row-reverse;
    flex: 1;
`

export default TagInput
