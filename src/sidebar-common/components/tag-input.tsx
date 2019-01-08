import * as React from 'react'

import { IndexDropdown } from '../../common-ui/containers'
import TagHolder from './tag-holder'

interface Props {
    isTagInputActive: boolean
    tags: string[]
    initTagSuggestions?: string[]
    addTag: (tag: string) => void
    deleteTag: (tag: string) => void
    setTagInputActive: (isTagInputActive: boolean) => void
}

/* tslint:disable-next-line variable-name */
const TagInputContainer = ({
    isTagInputActive,
    tags,
    initTagSuggestions,
    addTag,
    deleteTag,
    setTagInputActive,
}: Props) => {
    if (isTagInputActive) {
        return (
            <IndexDropdown
                isForAnnotation
                allowAdd
                initFilters={tags}
                initSuggestions={initTagSuggestions}
                onFilterAdd={addTag}
                onFilterDel={deleteTag}
                source="tag"
            />
        )
    }

    return (
        <TagHolder
            tags={tags}
            clickHandler={e => {
                e.stopPropagation()
                setTagInputActive(true)
            }}
            deleteTag={deleteTag}
        />
    )
}

export default TagInputContainer
