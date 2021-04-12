import React, { PureComponent } from 'react'
import styled from 'styled-components'

import colors from 'src/dashboard-refactor/colors'
import { SearchType } from '../types'

export interface Props {
    onNotesSearchSwitch: React.MouseEventHandler<HTMLButtonElement>
    onPagesSearchSwitch: React.MouseEventHandler<HTMLButtonElement>
    searchType: SearchType
}

export default class SearchTypeSwitch extends PureComponent<Props> {
    render() {
        return (
            <SearchTypeSwitchContainer>
                <SearchTypeBtn
                    onClick={this.props.onPagesSearchSwitch}
                    disabled={this.props.searchType === 'pages'}
                >
                    Pages
                </SearchTypeBtn>
                <SearchTypeBtn
                    onClick={this.props.onNotesSearchSwitch}
                    disabled={this.props.searchType === 'notes'}
                >
                    Highlights
                </SearchTypeBtn>
            </SearchTypeSwitchContainer>
        )
    }
}

const SearchTypeSwitchContainer = styled.div`
    display: flex;
`

const SearchTypeBtn = styled.button`
    color: ${colors.darkBlue};
    font-weight: 600;
    cursor: pointer;
    outline: none;
    margin-right: 5px;
    padding: 2px 8px 2px 8px;
    display: flex;
    border: none;
    align-items: center;
    background-color: transparent;

    &:disabled {
        background-color: ${colors.lightGrey};
        cursor: auto;
    }

    &:focus {
        background-color: ${colors.lightMintGreen};
    }
`
