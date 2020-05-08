import React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { StatefulUIElement } from 'src/util/ui-logic'
import TagPickerLogic, {
    TagPickerDependencies,
    TagPickerEvent,
    TagPickerState,
} from 'src/tags/ui/TagPicker/logic'
import { PickerSearchInput } from 'src/common-ui/GenericPicker/components/SearchInput'
import AddNewEntry from 'src/common-ui/GenericPicker/components/AddNewEntry'
import { InitLoader } from 'src/common-ui/GenericPicker/components/InitLoader'
import EntryResultsList from 'src/common-ui/GenericPicker/components/EntryResultsList'
import EntryRow, {
    IconStyleWrapper,
    ActOnAllTabsButton,
} from 'src/common-ui/GenericPicker/components/EntryRow'
import { EntrySelectedList } from 'src/common-ui/GenericPicker/components/EntrySelectedList'
import { KeyEvent, DisplayEntry } from 'src/common-ui/GenericPicker/types'
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
        this.processEvent('selectedEntryPress', { entry: tag })

    handleResultTagPress = (tag: DisplayEntry) =>
        this.processEvent('resultEntryPress', { entry: tag })

    handleResultTagAllPress = (tag: DisplayEntry) =>
        this.processEvent('resultEntryAllPress', { entry: tag })

    handleNewTagAllPress = () => this.processEvent('newEntryAllPress', {})

    handleResultTagFocus = (tag: DisplayEntry, index?: number) =>
        this.processEvent('resultEntryFocus', { entry: tag, index })

    handleNewTagPress = () =>
        this.processEvent('newEntryPress', { entry: this.state.newEntryName })

    handleKeyPress = (key: KeyEvent) => this.processEvent('keyPress', { key })

    renderTagRow = (tag: DisplayEntry, index: number) => (
        <EntryRow
            onPress={this.handleResultTagPress}
            onPressActOnAll={
                this.props.actOnAllTabs
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
        if (this.state.newEntryName !== '') {
            return
        }

        return (
            <EmptyTagsView>
                <strong>No Tags yet</strong>
                <br />
                Add new tags
                <br />
                via the search bar
            </EmptyTagsView>
        )
    }

    renderMainContent() {
        if (this.state.loadingSuggestions) {
            return <InitLoader size={20} />
        }

        return (
            <>
                <PickerSearchInput
                    searchInputPlaceholder="Add tags"
                    showPlaceholder={this.state.selectedEntries.length === 0}
                    searchInputRef={this.handleSetSearchInputRef}
                    onChange={this.handleSearchInputChanged}
                    onKeyPress={this.handleKeyPress}
                    value={this.state.query}
                    loading={this.state.loadingQueryResults}
                    before={
                        <EntrySelectedList
                            ActiveEntry={ActiveTag}
                            dataAttributeName="tag-name"
                            entriesSelected={this.state.selectedEntries}
                            onPress={this.handleSelectedTagPress}
                        />
                    }
                />
                {this.state.newEntryName !== '' && (
                    <AddNewEntry
                        resultItem={
                            <TagResultItem>
                                {this.state.newEntryName}
                            </TagResultItem>
                        }
                        onPress={this.handleNewTagPress}
                    >
                        {this.renderNewTagAllTabsButton}
                    </AddNewEntry>
                )}
                <EntryResultsList
                    entries={this.state.displayEntries}
                    renderEntryRow={this.renderTagRow}
                    emptyView={this.renderEmptyList()}
                    id="tagResults"
                />
            </>
        )
    }

    render() {
        return (
            <ThemeProvider theme={Colors.lightTheme}>
                <OuterSearchBox
                    onKeyPress={this.handleKeyPress}
                    onClick={this.handleOuterSearchBoxClick}
                >
                    {this.renderMainContent()}
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
    padding: 10px 15px;
    font-weight: 400;
    font-size: ${fontSizeNormal}px;
    text-align: center;
`

export default TagPicker
