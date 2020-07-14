import * as React from 'react'

import TagPicker from 'src/tags/ui/TagPicker'
import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'
import TagHolder from './tag-holder'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'

export interface Props {
    queryTagSuggestions: (query: string) => Promise<string[]>
    fetchInitialTagSuggestions: () => string[] | Promise<string[]>
    setTagInputActive: (isTagInputActive: boolean) => void
    deleteTag: (tag: string) => void
    updateTags: PickerUpdateHandler
    onKeyDown: React.KeyboardEventHandler
    onClickOutsideTagPicker: React.MouseEventHandler
    isTagInputActive: boolean
    tags: string[]
}

/* tslint:disable-next-line variable-name */
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
                    onClickOutside={this.props.onClickOutsideTagPicker}
                />
            </HoverBox>
        )
    }

    render() {
        return (
            <div onKeyDown={this.props.onKeyDown}>
                <TagHolder
                    clickHandler={(e) => {
                        e.stopPropagation()
                        this.props.setTagInputActive(
                            !this.props.isTagInputActive,
                        )
                    }}
                    {...this.props}
                />
                {this.renderTagPicker()}
            </div>
        )
    }
}

export default TagInput
