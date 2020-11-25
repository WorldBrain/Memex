import React, { PureComponent } from 'react'
import colors from 'src/dashboard-refactor/colors'
import Margin from 'src/dashboard-refactor/components/Margin'
import { sizeConstants } from 'src/dashboard-refactor/constants'
import styles, { fonts } from 'src/dashboard-refactor/styles'
import styled, { css } from 'styled-components'
import { SelectedState } from '../../types'

const windowWidth: number = window.innerWidth
const searchBarWidthPx: number = sizeConstants.searchBar.widthPx

const Container = styled.div<{ hidden: boolean }>`
    height: 30px;
    width: 100%;
    ${(props) =>
        css`
            display: ${props.hidden ? 'none' : 'flex'};
        `}
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
    display: flex;
    align-items: center;
    ${(props) => css`
        background-color: ${props.selected ? colors.lightGrey : colors.white};
    `}
    border: 1px solid ${colors.lightGrey};
    border-radius: ${styles.borderRadius.medium};
`

const TextSpan = styled.span`
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.normal};
    font-size: 10px;
    line-height: 15px;
`

export interface FiltersBarProps {
    isDisplayed: boolean
    dateFilterSelectedState: SelectedState
    domainFilterSelectedState: SelectedState
    tagFilterSelectedState: SelectedState
}

export default class FiltersBar extends PureComponent<FiltersBarProps> {
    private renderFilterSelectButton = (
        label: string,
        selectedState: SelectedState,
    ) => {
        const { isSelected, onSelection } = selectedState
        return (
            <Margin horizontal="7px" vertical="7px">
                <FilterSelectButton selected={isSelected} onClick={onSelection}>
                    <Margin horizontal="7px">
                        <TextSpan>{label}</TextSpan>
                    </Margin>
                </FilterSelectButton>
            </Margin>
        )
    }
    render() {
        const {
            isDisplayed,
            dateFilterSelectedState,
            domainFilterSelectedState,
            tagFilterSelectedState,
        } = this.props
        return (
            <Container hidden={!isDisplayed}>
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
                        'Tags',
                        tagFilterSelectedState,
                    )}
                </InnerContainer>
            </Container>
        )
    }
}
