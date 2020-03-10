import React from 'react'
import styled from 'styled-components'
import { ThemeProvider } from 'styled-components'

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
            <ThemeProvider theme={lightTheme}>
                {/* can we pass down the theme to these components?)*/}
                <TagPickerContainer>
                    <TagSearchInput onChange={this.handleSearchInputChanged} />
                    <TagList tags={tags} />
                </TagPickerContainer>
            </ThemeProvider>
        )
    }
}

const lightTheme = {
    background: '#fff',
}

const TagPickerContainer = styled.div`
    border: 1px solid #ceced9;
    box-shadow: 0px 0px 25px #dadbe7;
    background: ${props => props.theme.background};
    border-radius: 5px;
    max-height: 150px;
    padding: 8px;
    width: 350px;
`

const StyledTagPicker = styled(TagPicker)``

export default StyledTagPicker
