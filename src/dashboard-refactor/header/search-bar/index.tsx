import React, { PureComponent, ReactElement } from 'react'
import styled, { css } from 'styled-components'

import Margin from 'src/dashboard-refactor/components/Margin'

import { fonts } from '../../styles'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import TutorialBox from '@worldbrain/memex-common/lib/common-ui/components/tutorial-box'

export interface SearchBarProps {
    placeholder?: string
    searchQuery: string
    isSidebarLocked: boolean
    searchFiltersOpen: boolean
    onSearchQueryChange(queryString: string): void
    onSearchFiltersOpen(): void
    onInputClear(): void
    renderCopyPasterButton: () => ReactElement
    renderExpandButton: () => ReactElement
    getRootElement: () => HTMLElement
    inPageMode?: boolean
    isNotesSidebarShown?: boolean
}

interface State {
    showTutorial: boolean
}

export default class SearchBar extends PureComponent<SearchBarProps, State> {
    private inputRef = React.createRef<HTMLInputElement>()

    componentDidMount() {
        this.inputRef.current.focus()
    }

    state: State = {
        showTutorial: false,
    }

    handleChange: React.ChangeEventHandler = (evt) => {
        evt.stopPropagation()
        // need to amend getFilterStrings function to pull through search terms as well, then
        // bundle them in an object to send with the onSearchQueryChange func
        this.props.onSearchQueryChange((evt.target as HTMLInputElement).value)
    }

    handleClearSearch() {
        this.props.onInputClear()
        this.inputRef.current.focus()
    }

    render() {
        const {
            searchFiltersOpen,
            searchQuery,
            isSidebarLocked,
            onSearchFiltersOpen,
            renderCopyPasterButton,
            renderExpandButton,
        } = this.props
        return (
            <Margin vertical="auto">
                <SearchBarContainer
                    isClosed={!isSidebarLocked}
                    inPageMode={this.props.inPageMode}
                >
                    <FullWidthMargin>
                        {!!searchQuery ? (
                            <IconContainer>
                                <Margin right="5px">
                                    <Icon
                                        heightAndWidth="22px"
                                        filePath={icons.removeX}
                                        padding={'5px'}
                                        onClick={() => this.handleClearSearch()}
                                    />
                                </Margin>
                            </IconContainer>
                        ) : (
                            <IconContainer>
                                <Margin right="5px">
                                    <Icon
                                        heightAndWidth="22px"
                                        filePath={icons.searchIcon}
                                        padding={'5px'}
                                        hoverOff
                                    />
                                </Margin>
                            </IconContainer>
                        )}
                        <Input
                            ref={this.inputRef}
                            placeholder={
                                this.props.placeholder ??
                                'Search what you saved. Try "exact matches" and wordstarts*'
                            }
                            value={searchQuery}
                            id={'search-bar'}
                            onKeyDown={(e) => {
                                if (
                                    e.key !== 'ArrowDown' &&
                                    e.key !== 'ArrowUp' &&
                                    e.key !== 'Escape'
                                ) {
                                    e.stopPropagation()
                                }
                            }}
                            onChange={this.handleChange}
                            autoComplete="off"
                        />
                    </FullWidthMargin>
                </SearchBarContainer>
                <ActionButtons
                    isClosed={!isSidebarLocked}
                    inPageMode={this.props.inPageMode}
                    isNotesSidebarShown={this.props.isNotesSidebarShown}
                >
                    <FilterButton left="15px" onClick={onSearchFiltersOpen}>
                        {searchFiltersOpen ? (
                            <TooltipBox
                                placement={'bottom'}
                                tooltipText={'Clear Filters'}
                                getPortalRoot={this.props.getRootElement}
                            >
                                <Icon
                                    filePath={icons.removeX}
                                    heightAndWidth="22px"
                                    padding={'6px'}
                                />
                            </TooltipBox>
                        ) : (
                            <TooltipBox
                                placement={'bottom'}
                                tooltipText={'Apply Filters'}
                                getPortalRoot={this.props.getRootElement}
                            >
                                <Icon
                                    filePath={icons.filterIcon}
                                    heightAndWidth="24px"
                                    padding={'5px'}
                                />
                            </TooltipBox>
                        )}
                    </FilterButton>
                    {renderCopyPasterButton()}
                    {renderExpandButton()}
                    <TutorialBox
                        tutorialId="savePages"
                        getRootElement={this.props.getRootElement}
                        iconPadding={'6px'}
                        iconSize="22px"
                    />
                </ActionButtons>
                {!this.props.inPageMode && <Placeholder />}
            </Margin>
        )
    }
}

const Placeholder = styled.div`
    width: 220px;

    @media screen and (max-width: 900px) {
        width: 120px;
    }
`

const textStyles = `
    font-family: ${fonts.primary.name};
    font-style: normal;
    font-weight: ${fonts.primary.weight.bold};
    color: ${(props) => props.theme.colors.white};
`

const SearchBarContainer = styled.div<{
    isClosed: boolean
    inPageMode: boolean
}>`
    height: 44px;
    max-width: 450px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: ${(props) => props.theme.colors.greyScale2};
    border-radius: 5px;
    padding: 0px 15px;
    flex: 1;

    @media screen and (max-width: 900px) {
        margin-left: ${(props) => props.isClosed && '50px'};
    }

    &:focus-within {
        outline: 1px solid ${(props) => props.theme.colors.greyScale4};
    }

    ${(props) =>
        props.theme.variant === 'light' &&
        css`
            &:focus-within {
                outline: 1px solid ${(props) => props.theme.colors.prime1};
            }
        `};

    ${(props) =>
        props.inPageMode &&
        props.isClosed &&
        css`
            margin-left: 60px;
        `}
`

const Input = styled.input`
    width: inherit;
    font-size: 14px !important;
    line-height: 18px;
    border: none;
    background-color: transparent;
    height: 44px;
    color: ${(props) => props.theme.colors.white};
    font-weight: 400;
    margin: revert !important;

    &::placeholder {
        color: ${(props) => props.theme.colors.greyScale5};
    }

    &:focus {
        outline: none !important;
    }

    &:focus ${SearchBarContainer} {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3} !important;
    }
`

const FilterButton = styled(Margin)`
    width: max-content;
    font-size: 12px;
    cursor: pointer;
    width: auto;
    white-space: nowrap;
`

const FullWidthMargin = styled(Margin)`
    width: 100%;
    height: fill-available;
`

const SearchIcon = styled.img`
    width: 16px;
    height: 17px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const IconContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-items: start;
`

const StyledIcon = styled(Icon)`
    color: ${(props) => props.theme.colors.primary};
    opacity: 0.7;
    cursor: pointer;
`

const ActionButtons = styled.div<{
    isClosed?: boolean
    inPageMode?: boolean
    isNotesSidebarShown?: boolean
}>`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    grid-gap: 15px;
    ${(props) =>
        props.inPageMode &&
        (props.isClosed || props.isNotesSidebarShown) &&
        css`
            padding-right: 30px;
        `}
`
