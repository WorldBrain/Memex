import * as React from 'react'

import TagPicker from 'src/tags/ui/TagPicker'
import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'

export interface TagsContainerProps {
    queryTagSuggestions: (query: string) => Promise<string[]>
    fetchInitialTagSuggestions: () => Promise<string[]>
    updateTags: PickerUpdateHandler
    tags: string[]
}

/* tslint:disable-next-line variable-name */
const TagsContainer = (props: TagsContainerProps) => (
    <TagPicker
        onUpdateEntrySelection={props.updateTags}
        queryEntries={props.queryTagSuggestions}
        loadDefaultSuggestions={props.fetchInitialTagSuggestions}
        initialSelectedEntries={async () => props.tags}
    />
)
export default TagsContainer
