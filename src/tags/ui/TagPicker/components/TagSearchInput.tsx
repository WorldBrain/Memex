import React, { ChangeEvent } from 'react'
import styled from 'styled-components'
import { Search as SearchIcon } from '@styled-icons/feather'

interface Props {
    onChange: (value: string) => void
    value: string
    before: any
}
export class TagSearchInput extends React.PureComponent<Props> {
    onChange = (e: ChangeEvent<HTMLInputElement>) =>
        this.props.onChange(e.target.value)

    render() {
        return (
            <SearchBox>
                <StyledSearchIcon size={24} />
                {this.props.before}
                <SearchInput
                    value={this.props.value}
                    onChange={this.onChange}
                />
            </SearchBox>
        )
    }
}

const StyledSearchIcon = styled(SearchIcon)`
    stroke: ${props => props.theme.searchIcon};
    stroke-width: 2px;
    margin-right: 8px;
`

const SearchBox = styled.div`
    background-color: ${props => props.theme.searchBackground};
    border: 2px solid ${props => props.theme.searchBackground};
    border-radius: 3px;
    color: ${props => props.theme.text};
    display: flex;
    flex-wrap: wrap;
    font-size: 1rem;
    padding: 2px 8px;
    transition: border 0.2s;
`

const SearchInput = styled.input`
    border: none;
    background-image: none;
    background-color: transparent;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    box-shadow: none;

    &:focus {
        border: none;
        outline: none;
        background-image: none;
        background-color: transparent;
        -webkit-box-shadow: none;
        -moz-box-shadow: none;
        box-shadow: none;
        outline: none;
    }

    font-size: 1rem;
`
