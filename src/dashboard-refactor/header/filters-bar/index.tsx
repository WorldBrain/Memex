import React, { PureComponent } from 'react'
import colors from 'src/dashboard-refactor/colors'
import Margin from 'src/dashboard-refactor/components/Margin'
import { sizeConstants } from 'src/dashboard-refactor/constants'
import { fonts } from 'src/dashboard-refactor/styles'
import styled, { css } from 'styled-components'
import { SelectedState } from '../../types'

const windowWidth: number = window.innerWidth
const searchBarWidthPx: number = sizeConstants.searchBar.widthPx

const Container = styled.div`
    height: 30px;
    width: 100%;
    display: flex;
`

const InnerContainer = styled.div`
    width: ${searchBarWidthPx}px;
    left: ${(windowWidth - searchBarWidthPx) / 2}px;
    display: flex;
    align-items: center;
    justify-content: start;
`

const FilterSelectButton = styled.div<{ selected: boolean }>`
    height: 16px;
    width: min-content;
    ${(props) => css`
        background-color: ${props.selected ? colors.lightGrey : colors.white};
    `}
    border: 1px solid ${colors.lightGrey};
`

const TextSpan = styled.span`
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.normal}
    font-size: 10px;
    line-height: 15px;
`

export interface FilterBarProps {
    isDisplayed: boolean
    dateFilterSelectedState: SelectedState
    domainFilterSelectedState: SelectedState
    tagFilterSelectedState: SelectedState
}

export default class FilterBar extends PureComponent<FilterBarProps> {
    private renderFilterSelectButton = (
        label: string,
        selectedState: SelectedState,
    ) => {
        const { isSelected, onSelection } = selectedState
        return (
            <Margin horizontal="7px" vertical="7px">
                <FilterSelectButton selected={isSelected} onClick={onSelection}>
                    <TextSpan>{label}</TextSpan>
                </FilterSelectButton>
            </Margin>
        )
    }
    render() {
        const {
            dateFilterSelectedState,
            domainFilterSelectedState,
            tagFilterSelectedState,
        } = this.props
        return (
            <Container>
                <InnerContainer>
                    {this.renderFilterSelectButton(
                        'Date',
                        dateFilterSelectedState,
                    )}
                    {this.renderFilterSelectButton(
                        'Domains',
                        domainFilterSelectedState,
                    )}
                    {this.renderFilterSelectButton(
                        'Domains',
                        tagFilterSelectedState,
                    )}
                </InnerContainer>
            </Container>
        )
    }
}
