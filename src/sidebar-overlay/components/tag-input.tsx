import * as React from 'react'

import TagHolder from './tag-holder'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'

interface Props {
    env?: 'inpage' | 'overview'
    isTagInputActive: boolean
    tags: string[]
    initTagSuggestions?: string[]
    addTag: (tag: string) => void
    deleteTag: (tag: string) => void
    setTagInputActive: (isTagInputActive: boolean) => void
}

/* tslint:disable-next-line variable-name */
const TagInput = ({
    isTagInputActive,
    tags: initialSelectedEntries,
    initTagSuggestions,
    addTag,
    deleteTag,
    setTagInputActive,
    env,
}: Props) => {
    let tagPicker
    if (isTagInputActive) {
        const handleTagsUpdate = async ({ added, deleted }) => {
            if (added) {
                return addTag(added)
            }
            if (deleted) {
                return deleteTag(deleted)
            }
        }

        tagPicker = <HoverBox></HoverBox>
    }

    return (
        <>
            <TagHolder
                tags={initialSelectedEntries}
                clickHandler={(e) => {
                    e.stopPropagation()
                    setTagInputActive(true)
                }}
                deleteTag={deleteTag}
            />
            {tagPicker}
        </>
    )
}

export default TagInput
