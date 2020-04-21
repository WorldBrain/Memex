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
import AddNewTag, { AddNew } from 'src/tags/ui/TagPicker/components/AddNewTag'
import * as Colors from 'src/common-ui/components/design-library/colors'
import TagRowItem, {
    IconStyleWrapper,
    TagAllTabsButton,
} from 'src/tags/ui/TagPicker/components/TagRow'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'

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
            onPressTagAll={
                this.props.tagAllTabs
                    ? (t) => this.handleResultTagAllPress(t)
                    : undefined
            }
            onFocus={this.handleResultTagFocus}
            key={`TagKeyName-${tag.name}`}
            index={index}
            name={tag.name}
            selected={tag.selected}
            focused={tag.focused}
        />
    )

    renderNewTagAllTabsButton = () => (
        <IconStyleWrapper show>
            <ButtonTooltip tooltipText="Tag all tabs in window" position="left">
                <TagAllTabsButton
                    size={20}
                    onClick={this.handleNewTagAllPress}
                />
            </ButtonTooltip>
        </IconStyleWrapper>
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
                        showPlaceholder={this.state.selectedTags.length === 0}
                    />
                    {this.state.newTagName !== '' && (
                        <AddNewTag
                            tag={this.state.newTagName}
                            onPress={this.handleNewTagPress}
                        >
                            {this.renderNewTagAllTabsButton}
                        </AddNewTag>
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
    background: ${(props) => props.theme.background};
    padding: 8px;
    border-radius: 3px;
`

export default TagPicker
