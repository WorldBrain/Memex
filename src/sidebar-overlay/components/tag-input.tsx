import * as React from 'react'

import { IndexDropdown } from 'src/common-ui/containers'
import TagHolder from './tag-holder'
import TagPicker from 'src/tags/ui/TagPicker'
import { tags } from 'src/util/remote-functions-background'
import { TagHover } from 'src/common-ui/components/design-library/TagHover'

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
    tags: initialSelectedTags,
    initTagSuggestions,
    addTag,
    deleteTag,
    setTagInputActive,
    env,
}: Props) => {
    let tagPicker
    if (isTagInputActive) {
        const handleTagsUpdate = async (
            _: string[],
            added: string,
            deleted: string,
        ) => {
            if (added) {
                return addTag(added)
            }
            if (deleted) {
                return deleteTag(deleted)
            }
        }

        tagPicker = (
            <TagHover>
                <TagPicker
                    loadDefaultSuggestions={tags.fetchInitialTagSuggestions}
                    queryTags={(query: string) =>
                        tags.searchForTagSuggestions({ query })
                    }
                    onUpdateTagSelection={handleTagsUpdate}
                    initialSelectedTags={async () => initialSelectedTags}
                />
            </TagHover>
        )
    }

    return (
        <>
            <TagHolder
                tags={initialSelectedTags}
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
