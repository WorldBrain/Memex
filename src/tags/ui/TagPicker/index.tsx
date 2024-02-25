import React from 'react'
import isEqual from 'lodash/isEqual'
import styled, { ThemeProvider } from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'

import { StatefulUIElement } from 'src/util/ui-logic'
import TagPickerLogic, {
    TagPickerDependencies,
    TagPickerEvent,
    TagPickerState,
} from 'src/tags/ui/TagPicker/logic'
import { PickerSearchInput } from 'src/common-ui/GenericPicker/components/SearchInput'
import AddNewEntry from 'src/common-ui/GenericPicker/components/AddNewEntry'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import EntryResultsList from 'src/common-ui/GenericPicker/components/EntryResultsList'
import EntryRow, {
    IconStyleWrapper,
    ActOnAllTabsButton,
} from 'src/common-ui/GenericPicker/components/EntryRow'
import { KeyEvent, DisplayEntry } from 'src/common-ui/GenericPicker/types'
import * as Colors from 'src/common-ui/components/design-library/colors'
import { TagResultItem } from './components/TagResultItem'
import { EntrySelectedTag } from './components/EntrySelectedTag'
import { VALID_TAG_PATTERN } from '@worldbrain/memex-common/lib/storage/constants'
import { tags } from 'src/util/remote-functions-background'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

export type { TagPickerDependencies }

class TagPicker extends StatefulUIElement<
    TagPickerDependencies,
    TagPickerState,
    TagPickerEvent
> {
    static defaultProps: Pick<
        TagPickerDependencies,
        'queryEntries' | 'loadDefaultSuggestions'
    > = {
        queryEntries: (query) => tags.searchForTagSuggestions({ query }),
        loadDefaultSuggestions: null,
    }

    constructor(props: TagPickerDependencies) {
        super(props, new TagPickerLogic(props))
    }

    searchInputPlaceholder = this.props.searchInputPlaceholder ?? 'Search Tags'
    removeToolTipText = this.props.removeToolTipText ?? 'Remove tag from page'

    componentDidUpdate(
        prevProps: TagPickerDependencies,
        prevState: TagPickerState,
    ) {
        if (prevProps.query !== this.props.query) {
            this.processEvent('searchInputChanged', { query: this.props.query })
        }

        const prev = prevState.selectedEntries
        const curr = this.state.selectedEntries

        if (prev.length !== curr.length || !isEqual(prev, curr)) {
            this.props.onSelectedEntriesChange?.({
                selectedEntries: this.state.selectedEntries,
            })
        }
    }

    handleClickOutside = (e) => {
        if (this.props.onClickOutside) {
            this.props.onClickOutside(e)
        }
    }

    get shouldShowAddNew(): boolean {
        if (this.props.filterMode) {
            return false
        }

        const { newEntryName } = this.state
        return newEntryName !== '' && VALID_TAG_PATTERN.test(newEntryName)
    }

    handleSetSearchInputRef = (ref: HTMLInputElement) =>
        this.processEvent('setSearchInputRef', { ref })

    handleOuterSearchBoxClick = () => this.processEvent('focusInput', {})

    handleSearchInputChanged = (query: string) => {
        this.props.onSearchInputChange?.({ query })
        return this.processEvent('searchInputChanged', { query })
    }

    handleSelectedTagPress = (tag: string) =>
        this.processEvent('selectedEntryPress', { entry: tag })

    handleResultTagPress = (tag: DisplayEntry) =>
        this.processEvent('resultEntryPress', { entry: tag })

    handleResultTagAllPress = (tag: DisplayEntry) =>
        this.processEvent('resultEntryAllPress', { entry: tag })

    handleNewTagAllPress = () =>
        this.processEvent('newEntryAllPress', {
            entry: this.state.newEntryName,
        })

    handleResultTagFocus = (tag: DisplayEntry, index?: number) =>
        this.processEvent('resultEntryFocus', { entry: tag, index })

    handleNewTagPress = () =>
        this.processEvent('newEntryPress', { entry: this.state.newEntryName })

    handleKeyPress = (key: KeyEvent) => {
        if (key === 'Escape') {
            this.handleClickOutside(key)
        }
        this.processEvent('keyPress', { key })
    }

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
            resultItem={<TagResultItem>{tag.name}</TagResultItem>}
            removeTooltipText={this.removeToolTipText}
            actOnAllTooltipText="Tag all tabs in window"
        />
    )

    renderNewTagAllTabsButton = () =>
        this.props.actOnAllTabs && (
            <IconStyleWrapper>
                <TooltipBox
                    tooltipText="Tag all tabs in window"
                    placement="left"
                    getPortalRoot={null}
                ></TooltipBox>
            </IconStyleWrapper>
        )

    renderEmptyList() {
        if (this.state.newEntryName.length > 0 && !this.props.filterMode) {
            return
        }

        if (this.state.query === '' && this.props.filterMode) {
            return (
                <EmptyTagsView>
                    <SectionCircle>
                        <Icon
                            filePath={icons.backup}
                            heightAndWidth="16px"
                            color="prime1"
                            hoverOff
                        />
                    </SectionCircle>
                    <SectionTitle>Create your first Tag</SectionTitle>
                    <InfoText>by adding one to a page or annotation</InfoText>
                </EmptyTagsView>
            )
        }

        if (this.state.query === '' && !this.props.filterMode) {
            return (
                <EmptyTagsView>
                    <SectionCircle>
                        <Icon
                            filePath={icons.backup}
                            heightAndWidth="16px"
                            color="prime1"
                            hoverOff
                        />
                    </SectionCircle>
                    <SectionTitle>Create your first Tag</SectionTitle>
                    <InfoText>by typing into the search field</InfoText>
                </EmptyTagsView>
            )
        }

        return (
            <EmptyTagsView>
                <SectionCircle>
                    <Icon
                        filePath={icons.backup}
                        heightAndWidth="16px"
                        color="prime1"
                        hoverOff
                    />
                </SectionCircle>
                <SectionTitle>No Tags found for query</SectionTitle>
            </EmptyTagsView>
        )
    }

    renderMainContent() {
        if (this.state.loadingSuggestions) {
            return (
                <LoadingBox>
                    <LoadingIndicator />
                </LoadingBox>
            )
        }

        return (
            <>
                <PickerSearchInput
                    searchInputPlaceholder={this.searchInputPlaceholder}
                    showPlaceholder={this.state.selectedEntries.length === 0}
                    onChange={this.handleSearchInputChanged}
                    onKeyPress={this.handleKeyPress}
                    value={this.state.query}
                    loading={this.state.loadingQueryResults}
                    before={
                        <EntrySelectedTag
                            dataAttributeName="tag-name"
                            entriesSelected={this.state.selectedEntries}
                            onPress={this.handleSelectedTagPress}
                        />
                    }
                />
                <EntryResultsList
                    entries={this.state.displayEntries}
                    renderEntryRow={this.renderTagRow}
                    emptyView={this.renderEmptyList()}
                    id="tagResults"
                />
                {this.shouldShowAddNew && (
                    <AddNewEntry
                        resultItem={
                            <TagResultItem>
                                {this.state.newEntryName}
                            </TagResultItem>
                        }
                        onPress={this.handleNewTagPress}
                    >
                        {this.renderNewTagAllTabsButton()}
                    </AddNewEntry>
                )}
                <DeprecationWarningContainer>
                    <DeprecationWarning>
                        <DeprecationText>
                            Tags will soon be deprecated and merged into our new
                            <HighlightText>Spaces</HighlightText>.
                        </DeprecationText>
                        <PrimaryAction
                            label="Learn More"
                            onClick={() =>
                                window.open(
                                    'https://links.memex.garden/announcements/tags-collections-unification',
                                )
                            }
                            fontSize="10px"
                        />
                    </DeprecationWarning>
                </DeprecationWarningContainer>
            </>
        )
    }

    render() {
        return (
            <ThemeProvider theme={Colors.lightTheme}>
                <OuterSearchBox onClick={this.handleOuterSearchBoxClick}>
                    {this.renderMainContent()}
                    {this.props.children}
                </OuterSearchBox>
            </ThemeProvider>
        )
    }
}

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 30px;
    width: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 5px;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 14px;
    font-weight: bold;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    font-weight: 400;
`

const DeprecationText = styled.div`
    display: inline-block;
    font-size: 12px;
`

const IconSpan = styled(Icon)`
    vertical-align: middle;
    margin-right: 2px;
    margin-left: 5px;
`

const HighlightText = styled.span`
    color: ${(props) => props.theme.colors.primary};
    vertical-align: middle;
    padding-left: 5px;
`

const DeprecationWarningContainer = styled.div`
    padding-top: 5px;
    border-top: 1px solid ${(props) => props.theme.colors.lightgrey};
    margin-top: 5px;
`

const DeprecationWarning = styled.div`
    background-color: ${(props) => props.theme.colors.warning};
    border-radius: 3px;
    padding-top: 5px;
    margin: 5px 8px 5px 8px;
    display: grid;
    justify-content: flex-start;
    align-items: center;
    padding: 5px 10px;
    color: white;
    grid-gap: 10px;
    grid-auto-flow: column;
`

const LoadingBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
`

const OuterSearchBox = styled.div`
    background: ${(props) => props.theme.background};
    border-radius: 12px;
`

const EmptyTagsView = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    grid-gap: 5px;
    padding: 20px 15px;
`

export default TagPicker
