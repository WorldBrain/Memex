import React from 'react'
import styled, { ThemeProvider } from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import TagPickerLogic, {
    DisplayTag,
    TagPickerDependencies,
    TagPickerEvent,
    TagPickerState,
} from 'src/tags/ui/TagPicker/logic'
import { TagSearchInput } from 'src/tags/ui/TagPicker/components/TagSearchInput'
import { TagSelectedList } from 'src/tags/ui/TagPicker/components/TagSelectedList'
import TagResultsList from 'src/tags/ui/TagPicker/components/TagResultsList'
import AddNewTag from 'src/tags/ui/TagPicker/components/AddNewTag'

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

    handleSelectedTagPress = (tag: string) =>
        this.processEvent('selectedTagPress', { tag })

    handleResultTagPress = (tag: DisplayTag) =>
        this.processEvent('resultTagPress', { tag })

    handleNewTagPress = () =>
        this.processEvent('newTagPress', { tag: this.state.newTagName })

    render() {
        return (
            <ThemeProvider theme={lightTheme}>
                <StyledContainer>
                    <TagSearchInput
                        onChange={this.handleSearchInputChanged}
                        value={this.state.query}
                        before={
                            <TagSelectedList
                                tagsSelected={this.state.selectedTags}
                                onPress={this.handleSelectedTagPress}
                            />
                        }
                    />
                    {this.state.newTagName && (
                        <AddNewTag
                            tag={this.state.newTagName}
                            onPress={this.handleNewTagPress}
                        />
                    )}
                    <TagResultsList
                        tags={this.state.displayTags}
                        onPress={this.handleResultTagPress}
                    />
                </StyledContainer>
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

const StyledContainer = styled.div`
    border: 1px solid #ceced9;
    box-shadow: 0px 0px 25px #dadbe7;
    background: ${props => props.theme.background};
    border-radius: 5px;
    max-height: 150px;
    padding: 8px;
    width: 350px;
`

export default TagPicker
