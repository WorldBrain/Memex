import React, { PureComponent, ReactElement } from 'react'
import styled from 'styled-components'

import Margin from 'src/dashboard-refactor/components/Margin'

import colors from '../../colors'
import styles, { fonts } from '../../styles'
import * as icons from 'src/common-ui/components/design-library/icons'
import { Icon } from 'src/dashboard-refactor/styled-components'
import { ButtonTooltip } from 'src/common-ui/components'

const textStyles = `
    font-family: ${fonts.primary.name};
    font-style: normal;
    font-weight: ${fonts.primary.weight.bold};
    color: ${(props) => props.theme.colors.normalText};
`

const SearchBarContainer = styled.div`
    height: 44px;
    max-width: 450px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: ${(props) => props.theme.colors.darkhover};
    border-radius: 5px;
    padding: 0px 15px;

    &:focus {
        outline: 1px solid ${(props) => props.theme.colors.lineGrey};
    }
`

const Input = styled.input`
    width: inherit;
    font-size: 14px;
    line-height: 18px;
    border: none;
    background-color: transparent;
    color: ${(props) => props.theme.colors.normalText};
    font-weight: 300;

    &::placeholder {
        color: ${(props) => props.theme.colors.darkText};
    }

    &:focus {
        outline: none;
    }
`

const FilterButton = styled(Margin)`
    width: max-content;
    ${textStyles}
    font-size: 12px;
    line-height: 15px;
    cursor: pointer;
    width: auto;
    white-space: nowrap;
`

const FullWidthMargin = styled(Margin)`
    width: 100%;
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

const ActionButtons = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    grid-gap: 15px;
`
export interface SearchBarProps {
    placeholder?: string
    searchQuery: string
    searchFiltersOpen: boolean
    onSearchQueryChange(queryString: string): void
    onSearchFiltersOpen(): void
    onInputClear(): void
    CopyPasterButton: ReactElement
    ExpandButton: ReactElement
}

export default class SearchBar extends PureComponent<SearchBarProps> {
    private inputRef = React.createRef<HTMLInputElement>()

    componentDidMount() {
        this.inputRef.current.focus()
    }

    handleChange: React.KeyboardEventHandler = (evt) => {
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
            onSearchFiltersOpen,
            CopyPasterButton,
            ExpandButton,
        } = this.props
        return (
            <Margin vertical="auto">
                <SearchBarContainer>
                    <FullWidthMargin>
                        {!!searchQuery ? (
                            <IconContainer>
                                <Margin right="5px">
                                    <Icon
                                        heightAndWidth="22px"
                                        path={icons.removeX}
                                        onClick={() => this.handleClearSearch()}
                                    />
                                </Margin>
                            </IconContainer>
                        ) : (
                            <IconContainer>
                                <Margin right="5px">
                                    <Icon
                                        heightAndWidth="22px"
                                        path={icons.searchIcon}
                                    />
                                </Margin>
                            </IconContainer>
                        )}
                        <Input
                            ref={this.inputRef}
                            placeholder={
                                this.props.placeholder ??
                                'Search your saved pages and notes'
                            }
                            value={searchQuery}
                            onChange={this.handleChange}
                            autoComplete="off"
                        />
                    </FullWidthMargin>
                </SearchBarContainer>
                <ActionButtons>
                    <FilterButton left="15px" onClick={onSearchFiltersOpen}>
                        {searchFiltersOpen ? (
                            <ButtonTooltip
                                position={'bottom'}
                                tooltipText={'Clear Filters'}
                            >
                                <Icon
                                    path={icons.removeX}
                                    heightAndWidth="24px"
                                    color={'greyScale8'}
                                />
                            </ButtonTooltip>
                        ) : (
                            <ButtonTooltip
                                position={'bottom'}
                                tooltipText={'Apply Filters'}
                            >
                                <Icon
                                    path={icons.filterIcon}
                                    heightAndWidth="24px"
                                    color={'greyScale8'}
                                />
                            </ButtonTooltip>
                        )}
                    </FilterButton>
                    {CopyPasterButton}
                    {ExpandButton}
                </ActionButtons>
            </Margin>
        )
    }
}
