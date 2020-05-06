import * as React from 'react'

import TagPicker from 'src/tags/ui/TagPicker'
import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'
import TagHolder from './tag-holder'

export interface Props {
    queryTagSuggestions: (query: string) => Promise<string[]>
    fetchInitialTagSuggestions: () => Promise<string[]>
    setTagInputActive: (isTagInputActive: boolean) => void
    deleteTag: (tag: string) => void
    updateTags: PickerUpdateHandler
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
    if (isTagInputActive) {
        return (
            <TagPicker
                onUpdateEntrySelection={props.updateTags}
                queryEntries={props.queryTagSuggestions}
                loadDefaultSuggestions={props.fetchInitialTagSuggestions}
                initialSelectedEntries={async () => tags}
            />
        )
    }

    return (
        <TagHolder
            tags={tags}
            clickHandler={(e) => {
                e.stopPropagation()
                setTagInputActive(true)
            }}
            deleteTag={deleteTag}
        />
    )
}

export default TagInput
