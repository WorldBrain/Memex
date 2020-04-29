import React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { StatefulUIElement } from 'src/util/ui-logic'
import TagPickerLogic, {
    DisplayTag,
    TagPickerDependencies,
    TagPickerEvent,
    TagPickerState,
} from 'src/tags/ui/TagPicker/logic'
import { PickerSearchInput } from 'src/common-ui/GenericPicker/components/SearchInput'
import AddNewEntry from 'src/common-ui/GenericPicker/components/AddNewEntry'
import EntryResultsList from 'src/common-ui/GenericPicker/components/EntryResultsList'
import EntryRow, {
    IconStyleWrapper,
    ActOnAllTabsButton,
} from 'src/common-ui/GenericPicker/components/EntryRow'
import { EntrySelectedList } from 'src/common-ui/GenericPicker/components/EntrySelectedList'
import { KeyEvent } from 'src/common-ui/GenericPicker/types'
import * as Colors from 'src/common-ui/components/design-library/colors'
import { fontSizeNormal } from 'src/common-ui/components/design-library/typography'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import { TagResultItem } from './components/TagResultItem'
import { ActiveTag } from './components/ActiveTag'

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
        <EntryRow
            onPress={this.handleResultTagPress}
            onPressActOnAll={
                this.props.tagAllTabs
                    ? (t) => this.handleResultTagAllPress(t)
                    : undefined
            }
            onFocus={this.handleResultTagFocus}
            key={`TagKeyName-${tag.name}`}
            index={index}
            name={tag.name}
            focused={tag.focused}
            selected={tag.selected}
            ResultItem={TagResultItem}
            removeTooltipText="Remove tag from page"
            actOnAllTooltipText="Tag all tabs in window"
        />
    )

    renderNewTagAllTabsButton = () => (
        <IconStyleWrapper show>
            <ButtonTooltip tooltipText="Tag all tabs in window" position="left">
                <ActOnAllTabsButton
                    size={20}
                    onClick={this.handleNewTagAllPress}
                />
            </ButtonTooltip>
        </IconStyleWrapper>
    )

    renderEmptyList() {
        return <EmptyTagsView>No tags exist yet</EmptyTagsView>
    }

    render() {
        return (
            <ThemeProvider theme={Colors.lightTheme}>
                <OuterSearchBox
                    onKeyPress={this.handleKeyPress}
                    onClick={this.handleOuterSearchBoxClick}
                >
                    <PickerSearchInput
                        showPlaceholder={this.state.selectedTags.length === 0}
                        searchInputRef={this.handleSetSearchInputRef}
                        onChange={this.handleSearchInputChanged}
                        onKeyPress={this.handleKeyPress}
                        value={this.state.query}
                        loading={
                            this.state.loadingSuggestions ||
                            this.state.loadingQueryResults
                        }
                        before={
                            <EntrySelectedList
                                ActiveEntry={ActiveTag}
                                attributeName="data-tag-name"
                                entriesSelected={this.state.selectedTags}
                                onPress={this.handleSelectedTagPress}
                            />
                        }
                    />
                    {this.state.newTagName !== '' && (
                        <AddNewEntry
                            resultItem={
                                <TagResultItem>
                                    {this.state.newTagName}
                                </TagResultItem>
                            }
                            onPress={this.handleNewTagPress}
                        >
                            {this.renderNewTagAllTabsButton}
                        </AddNewEntry>
                    )}
                    <EntryResultsList
                        entries={this.state.displayTags}
                        renderEntryRow={this.renderTagRow}
                        emptyView={this.renderEmptyList()}
                        id="tagResults"
                    />
                    {this.props.children}
                </OuterSearchBox>
            </ThemeProvider>
        )
    }
}

const OuterSearchBox = styled.div`
    background: ${(props) => props.theme.background};
    padding-top: 8px;
    padding-bottom: 8px;
    border-radius: 3px;
`

const EmptyTagsView = styled.div`
    color: ${(props) => props.theme.tag.text};
    padding: 20px 15px;
    font-weight: 400;
    font-size: ${fontSizeNormal}px;
`

export default TagPicker
