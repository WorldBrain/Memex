import React, { EventHandler, KeyboardEvent, KeyboardEventHandler } from 'react'
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
import * as Colors from 'src/common-ui/components/design-library/colors'

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

    handleKeyPress = (e: KeyboardEvent<any>) =>
        this.processEvent('keyPress', { e })

    render() {
        return (
            <ThemeProvider theme={Colors.lightTheme}>
                <StyledContainer onKeyPress={this.handleKeyPress}>
                    <TagSearchInput
                        onChange={this.handleSearchInputChanged}
                        onKeyPress={this.handleKeyPress}
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

// TODO we need an empty state. No tags in the search box show 'Search tags' if its a filter... 'search or filter tags'

const StyledContainer = styled.div`
    border: 1px solid #ceced9;
    box-shadow: 0px 0px 25px #dadbe7;
    background: ${props => props.theme.background};
    border-radius: 5px;
    height: auto;
    padding: 8px;
    width: 350px;
    font-family: 'Poppins', sans-serif;
`

export default TagPicker
