import React, { PureComponent } from 'react'

import TagPickerComponent from 'src/tags/ui/TagPicker'

import { tags } from 'src/util/remote-functions-background'
import { FilterPickerProps } from './types'

export default class TagPicker extends PureComponent<FilterPickerProps> {
    render() {
        const {
            onToggleShowPicker,
            onEntriesListUpdate,
            initialSelectedEntries,
        } = this.props
        return (
            <TagPickerComponent
                onUpdateEntrySelection={onEntriesListUpdate}
                queryEntries={(query) =>
                    tags.searchForTagSuggestions({ query })
                }
                loadDefaultSuggestions={tags.fetchInitialTagSuggestions}
                initialSelectedEntries={async () => initialSelectedEntries}
                onEscapeKeyDown={onToggleShowPicker}
            />
        )
    }
}
