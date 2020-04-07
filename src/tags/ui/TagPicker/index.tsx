import React, { EventHandler, KeyboardEvent, KeyboardEventHandler } from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { StatefulUIElement } from 'src/util/ui-logic'
import TagPickerLogic, {
    DisplayTag,
    TagPickerDependencies,
    TagPickerEvent,
    TagPickerState,
} from 'src/tags/ui/TagPicker/logic'
import {
    KeyEvent,
    TagSearchInput,
} from 'src/tags/ui/TagPicker/components/TagSearchInput'
import { TagSelectedList } from 'src/tags/ui/TagPicker/components/TagSelectedList'
import TagResultsList from 'src/tags/ui/TagPicker/components/TagResultsList'
import AddNewTag from 'src/tags/ui/TagPicker/components/AddNewTag'
import * as Colors from 'src/common-ui/components/design-library/colors'
import TagRowItem from 'src/tags/ui/TagPicker/components/TagRow'
import { colorGrey5 } from 'src/common-ui/components/design-library/colors'

class TagPicker extends StatefulUIElement<
    TagPickerDependencies,
    TagPickerState,
    TagPickerEvent
> {
    constructor(props: TagPickerDependencies) {
        super(props, new TagPickerLogic(props))
    }

    handleSetSearchInputRef = (ref: HTMLInputElement) =>
        this.processEvent('setSearchInputRef', { ref })
    handleOuterSearchBoxClick = () => this.processEvent('focusInput', {})

    handleSearchInputChanged = (query: string) => {
        return this.processEvent('searchInputChanged', { query })
    }

    handleSelectedTagPress = (tag: string) =>
        this.processEvent('selectedTagPress', { tag })

    handleResultTagPress = (tag: DisplayTag) =>
        this.processEvent('resultTagPress', { tag })

    handleResultTagAllPress = (tag: DisplayTag) =>
        this.processEvent('resultTagAllPress', { tag })

    handleNewTagAllPress = () => this.processEvent('newTagAllPress', {})

    handleResultTagFocus = (tag: DisplayTag, index?: number) =>
        this.processEvent('resultTagFocus', { tag, index })

    handleNewTagPress = () =>
        this.processEvent('newTagPress', { tag: this.state.newTagName })

    handleKeyPress = (key: KeyEvent) => this.processEvent('keyPress', { key })

    renderTagRow = (tag: DisplayTag, index: number) => (
        <TagRowItem
            onPress={this.handleResultTagPress}
            onPressTagAll={this.handleResultTagAllPress}
            onFocus={this.handleResultTagFocus}
            key={`TagKeyName-${tag.name}`}
            index={index}
            name={tag.name}
            selected={tag.selected}
            focused={tag.focused}
        />
    )

    render() {
        return (
            <ThemeProvider theme={Colors.lightTheme}>
                <OuterSearchBox
                    onKeyPress={this.handleKeyPress}
                    onClick={this.handleOuterSearchBoxClick}
                >
                    <TagSearchInput
                        searchInputRef={this.handleSetSearchInputRef}
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
                    {this.state.newTagName !== '' && (
                        <AddNewTag
                            tag={this.state.newTagName}
                            onPress={this.handleNewTagPress}
                            onPressTagAll={this.handleNewTagAllPress}
                        />
                    )}
                    <TagResultsList
                        tags={this.state.displayTags}
                        renderTagRow={this.renderTagRow}
                    />
                    {this.props.children}
                </OuterSearchBox>
            </ThemeProvider>
        )
    }
}

const OuterSearchBox = styled.div`
    background: ${props => props.theme.background};
    padding: 8px;
    border-radius: 3px;
`

export default TagPicker
