import * as React from 'react'

import { IndexDropdown } from 'src/common-ui/containers'
import TagHolder from './tag-holder'
import TagPicker from 'src/tags/ui/TagPicker'
import { tags } from 'src/util/remote-functions-background'
import { Hover } from 'src/common-ui/components/design-library/Hover'

interface Props {
    isTagInputActive: boolean
    tags: string[]
    initTagSuggestions?: string[]
    addTag: (tag: string) => void
    deleteTag: (tag: string) => void
}

/* tslint:disable-next-line variable-name */
const TagInput = ({
    isTagInputActive,
    tags: selectedTags,
    initTagSuggestions,
    addTag,
    deleteTag,
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
                    initialSelectedTags={async () => selectedTags}
                    updatedSelectedTags={selectedTags}
                />
            </Hover>
        )
    }

    // TODO: do we still need this? (not in the edit annotation tags, but maybe elsewhere?)
    // return (
    //     <TagHolder
    //         tags={selectedTags}
    //         clickHandler={e => {
    //             e.stopPropagation()
    //             setTagInputActive(true)
    //         }}
    //         deleteTag={deleteTag}
    //     />
    // )
}

export default TagInput
