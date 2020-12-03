import React, { PureComponent } from 'react'

import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'

import { collections } from 'src/util/remote-functions-background'
import { FilterPickerProps } from './types'

export default class ListPicker extends PureComponent<FilterPickerProps> {
    render() {
        const {
            onToggleShowPicker,
            onEntriesListUpdate,
            initialSelectedEntries,
        } = this.props
        return (
            <CollectionPicker
                onUpdateEntrySelection={onEntriesListUpdate}
                queryEntries={(query) =>
                    collections.searchForListSuggestions({ query })
                }
                loadDefaultSuggestions={collections.fetchInitialListSuggestions}
                initialSelectedEntries={async () => initialSelectedEntries}
                onEscapeKeyDown={onToggleShowPicker}
            />
        )
    }
}
