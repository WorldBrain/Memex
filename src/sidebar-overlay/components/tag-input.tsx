import * as React from 'react'

import { IndexDropdown } from 'src/common-ui/containers'
import TagHolder from './tag-holder'
import TagPicker from 'src/tags/ui/TagPicker'
import { tags } from 'src/util/remote-functions-background'
import { Hover } from 'src/common-ui/components/design-library/Hover'

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

        return (
            <Hover>
                <TagPicker
                    loadDefaultSuggestions={() => initTagSuggestions ?? []}
                    queryTags={(query: string) =>
                        tags.searchForTagSuggestions({ query })
                    }
                    onUpdateTagSelection={handleTagsUpdate}
                    initialSelectedTags={async () => initialSelectedTags}
                />
            </Hover>
        )
    }

    return (
        <TagHolder
            tags={initialSelectedTags}
            clickHandler={(e) => {
                e.stopPropagation()
                setTagInputActive(true)
            }}
            deleteTag={deleteTag}
        />
    )
}

export default TagInput
