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
    isTagInputActive: boolean
    tags: string[]
}

/* tslint:disable-next-line variable-name */
const TagInput = ({
    isTagInputActive,
    tags,
    setTagInputActive,
    deleteTag,
    ...props
}: Props) => {
    let tagPicker

    if (isTagInputActive) {
        tagPicker = (
            <HoverBox>
                <TagPicker
                    onUpdateEntrySelection={props.updateTags}
                    queryEntries={props.queryTagSuggestions}
                    loadDefaultSuggestions={props.fetchInitialTagSuggestions}
                    initialSelectedEntries={async () => tags}
                    onEscapeKeyDown={() => setTagInputActive(false)}
                />
            </HoverBox>
        )
    }

    return (
        <div onKeyDown={props.onKeyDown}>
            <TagHolder
                tags={tags}
                clickHandler={(e) => {
                    e.stopPropagation()
                    setTagInputActive(true)
                }}
                deleteTag={deleteTag}
            />
            {tagPicker}
        </div>
    )
}

export default TagInput
