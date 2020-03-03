import React from 'react'
import styled from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import TagPickerLogic, {
    TagPickerDependencies,
    TagPickerEvent,
    TagPickerState,
} from 'src/tags/ui/TagPicker/logic'
import { TagSearchInput } from 'src/tags/ui/TagPicker/components/TagSearchInput'
import TagList from 'src/tags/ui/TagPicker/components/TagList'

class TagPicker extends StatefulUIElement<
    TagPickerDependencies,
    TagPickerState,
    TagPickerEvent
> {
    constructor(props: TagPickerDependencies) {
        super(props, new TagPickerLogic(props))
    }

    handleSearchInputChanged = (query: string) =>
        this.processEvent('searchInputChanged', { query })

    render() {
        const tags =
            (this.state.queryResults?.length ?? 0) > 0
                ? this.state.queryResults
                : this.state.initialTags

        return (
            <>
                <TagSearchInput onChange={this.handleSearchInputChanged} />
                <TagList tags={tags} />
            </>
        )
    }
}
const StyledTagPicker = styled(TagPicker)``
export default StyledTagPicker
