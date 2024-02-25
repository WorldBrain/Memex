import React from 'react'
import isEqual from 'lodash/isEqual'
import styled, { ThemeProvider } from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import DomainPickerLogic, {
    DomainPickerDependencies,
    DomainPickerEvent,
    DomainPickerState,
} from './logic'
import { PickerSearchInput } from 'src/common-ui/GenericPicker/components/SearchInput'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import EntryResultsList from 'src/common-ui/GenericPicker/components/EntryResultsList'
import EntryRow from 'src/common-ui/GenericPicker/components/EntryRow' // ActOnAllTabsButton, // IconStyleWrapper,
import { KeyEvent, DisplayEntry } from 'src/common-ui/GenericPicker/types'
import * as Colors from 'src/common-ui/components/design-library/colors'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'

class DomainPicker extends StatefulUIElement<
    DomainPickerDependencies,
    DomainPickerState,
    DomainPickerEvent
> {
    private searchInputRef = React.createRef<HTMLInputElement>()

    constructor(props: DomainPickerDependencies) {
        super(props, new DomainPickerLogic(props))
    }

    private get selectedDisplayEntries(): string[] {
        return this.state.selectedEntries
            .map(
                (_entry) =>
                    this.state.displayEntries.find(
                        (entry) => entry.name === _entry,
                    )?.name,
            )
            .filter((entry) => entry != null)
    }

    searchInputPlaceholder =
        this.props.searchInputPlaceholder ?? 'Domains to Search'
    removeToolTipText = this.props.removeToolTipText ?? 'Remove filter'

    componentDidUpdate(
        prevProps: DomainPickerDependencies,
        prevState: DomainPickerState,
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

    handleClickOutside: React.MouseEventHandler = (e) => {
        if (this.props.onClickOutside) {
            this.props.onClickOutside(e)
        }
    }

    private handleSetSearchInputRef = (ref: HTMLInputElement) =>
        this.processEvent('setSearchInputRef', { ref })

    private handleOuterSearchBoxClick: React.MouseEventHandler = () =>
        this.processEvent('focusInput', {})

    private handleSearchInputChanged = (query: string) => {
        this.props.onSearchInputChange?.({ query })
        return this.processEvent('searchInputChanged', { query })
    }

    private handleSelectedDomainPress = (domain: string) =>
        this.processEvent('selectedEntryPress', { entry: domain })

    private handleResultDomainPress = (domain: DisplayEntry) =>
        this.processEvent('resultEntryPress', { entry: domain })

    private handleResultDomainFocus = (domain: DisplayEntry, index?: number) =>
        this.processEvent('resultEntryFocus', { entry: domain, index })

    private handleKeyPress = (key: KeyEvent) => {
        // Extract the key from the event and cast it to KeyEvent
        // Pass the extracted key to processEvent
        return this.processEvent('keyPress', { key })
    }
    private renderDomainRow = (domain: DisplayEntry, index: number) => (
        <EntryRow
            onPress={this.handleResultDomainPress}
            onFocus={this.handleResultDomainFocus}
            key={`DomainKeyName-${domain.name}`}
            index={index}
            name={domain.name}
            selected={domain.selected}
            focused={domain.focused}
            resultItem={<DomainResultItem>{domain.name}</DomainResultItem>}
            removeTooltipText="Remove filter"
        />
    )

    private renderEmptyDomain() {
        if (this.state.query === '') {
            return (
                <EmptyDomainsView>
                    <IconBox heightAndWidth="30px">
                        <Icon
                            filePath={icons.globe}
                            heightAndWidth="16px"
                            color="prime1"
                            hoverOff
                        />
                    </IconBox>
                    <SectionTitle>No Domains to filter</SectionTitle>
                    <InfoText>Save a first page or annotation</InfoText>
                </EmptyDomainsView>
            )
        }

        return (
            <EmptyDomainsView>
                <IconBox heightAndWidth="30px">
                    <Icon
                        filePath={icons.globe}
                        heightAndWidth="16px"
                        color="prime1"
                        hoverOff
                    />
                </IconBox>
                <SectionTitle>No domains found for query</SectionTitle>
            </EmptyDomainsView>
        )
    }

    private renderMainContent() {
        if (this.state.loadingSuggestions) {
            return (
                <LoadingBox>
                    <LoadingIndicator size={30} />
                </LoadingBox>
            )
        }

        return (
            <>
                <PickerSearchInput
                    searchInputPlaceholder={this.searchInputPlaceholder}
                    showPlaceholder={this.state?.selectedEntries.length === 0}
                    searchInputRef={this.searchInputRef}
                    onChange={this.handleSearchInputChanged}
                    onKeyPress={(key) => this.handleKeyPress(key)}
                    value={this.state?.query}
                    loading={this.state?.loadingQueryResults}
                    // before={
                    //     <EntrySelectedList
                    //         dataAttributeName="domain-name"
                    //         entriesSelected={this.selectedDisplayEntries}
                    //         onPress={this.handleSelectedDomainPress}
                    //     />
                    // }
                />
                <ResultsScrollContainer>
                    <EntryResultsList
                        entries={this.state?.displayEntries}
                        renderEntryRow={this.renderDomainRow}
                        emptyView={this.renderEmptyDomain()}
                        id="domainResults"
                    />
                </ResultsScrollContainer>
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

const ResultsScrollContainer = styled.div`
    max-height: 300px;
    overflow: scroll;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.greyScale2};
    border: 1px solid ${(props) => props.theme.colors.greyScale6};
    border-radius: 8px;
    height: 30px;
    width: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale6};
    margin-top: 10px;
    font-size: 14px;
    font-weight: 400;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    font-weight: 300;
`

const LoadingBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 300px;
    width: 100%;
`

const OuterSearchBox = styled.div`
    border-radius: 12px;
    width: 300px;
    padding: 10px;
`

const EmptyDomainsView = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    grid-gap: 5px;
    padding: 20px 15px;
`

const DomainResultItem = styled.div`
    display: flex;
    border-radius: 4px;
    color: ${(props) => props.theme.colors.greyScale6};
    padding: 0px;
    margin: 2px 4px 2px 0;
    font-weight: 400;
    font-size: 14px;
    transition: all 0.1s;
    word-break: break-word;

    &:hover {
        cursor: pointer;
    }
`

export default DomainPicker
