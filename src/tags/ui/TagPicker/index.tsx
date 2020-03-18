import React from 'react'
import styled, { ThemeProvider } from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import TagPickerLogic, {
    TagPickerDependencies,
    TagPickerEvent,
    TagPickerState,
} from 'src/tags/ui/TagPicker/logic'
import { TagSearchInput } from 'src/tags/ui/TagPicker/components/TagSearchInput'
import { TagSelectedList } from 'src/tags/ui/TagPicker/components/TagSelectedList'
import { Tag } from 'src/tags/background/types'
import TagResultsList from 'src/tags/ui/TagPicker/components/TagResultsList'

class TagPicker extends StatefulUIElement<
    TagPickerDependencies,
    TagPickerState,
    TagPickerEvent
> {
    constructor(props: TagPickerDependencies) {
        super(props, new TagPickerLogic(props))
    }

    handleSearchInputChanged = (query: string) => {
        return this.processEvent('searchInputChanged', { query })
    }

    handleSelectedTagPress = (tag: Tag) =>
        this.processEvent('selectedTagPress', { tag })

    render() {
        const tags = TagPickerLogic.getTagsToDisplay(this.state)

        return (
            <ThemeProvider theme={lightTheme}>
                <TagPickerContainer>
                    <TagSearchInput onChange={this.handleSearchInputChanged}>
                        <TagSelectedList
                            tagsSelected={this.state.selectedTags}
                            onPress={this.handleSelectedTagPress}
                        />
                    </TagSearchInput>

                    <TagResultsList tags={tags} />
                </TagPickerContainer>
            </ThemeProvider>
        )
    }
}

// themes should be global to go into a theme file and are referenced from a higher component (even app.js) for now its just here (proof of concept)
const lightTheme = {
    background: '#fff',
    searchBackground: '#F1F1F5',
    tag: {
        tag: '#44ff88',
        border: '#83c9f4',
        hover: '#83c9f4',
        selected: '#83c9f4',
        text: '#083957',
    },
}
const darkTheme = {
    text: '#72727F',
    searchBackground: '#F1F1F5',
    tag: {
        tag: '#44ff88',
        border: '#83c9f4',
        hover: '#83c9f4',
        selected: '#83c9f4',
        text: '#083957',
    },
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

export default TagPicker
