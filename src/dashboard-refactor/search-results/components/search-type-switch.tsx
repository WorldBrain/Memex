import React, { PureComponent } from 'react'
import styled from 'styled-components'

import colors from 'src/dashboard-refactor/colors'
import { SearchType } from '../types'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

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
                    <Icon
                        filePath={
                            this.props.searchType === 'pages'
                                ? icons.fileFull
                                : icons.file
                        }
                        height="16px"
                        color="primary"
                    />{' '}
                    Pages
                </SearchTypeBtn>
                <SearchTypeBtn
                    onClick={this.props.onNotesSearchSwitch}
                    disabled={this.props.searchType === 'notes'}
                >
                    <Icon
                        filePath={
                            this.props.searchType === 'notes'
                                ? icons.highlighterFull
                                : icons.highlighterEmpty
                        }
                        height="16px"
                        color="primary"
                    />
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
    color: ${(props) => props.theme.colors.primary};
    font-weight: 600;
    cursor: pointer;
    outline: none;
    margin-right: 5px;
    padding: 2px 8px 2px 8px;
    display: grid;
    grid-auto-flow: column;
    grid-gap: 5px;
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
