import React, { ChangeEvent } from 'react'
import styled from 'styled-components'

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
                {this.props.before}
                <SearchInput
                    value={this.props.value}
                    onChange={this.onChange}
                />
            </SearchBox>
        )
    }
}

const SearchBox = styled.div`
    display: flex;

    background: ${props => props.theme.searchBackground};
    background-color: ${props => props.theme.searchBackground};
    border: 2px solid ${props => props.theme.searchBackground};
    border-radius: 3px;
    background: url(/img/search.svg) no-repeat 8px 50%;
    background-size: 20px;
    color: ${props => props.theme.text};
    flex: 1;
    font-size: 1rem;
    padding: 8px 8px 8px 32px;
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
        background-image: none;
        background-color: transparent;
        -webkit-box-shadow: none;
        -moz-box-shadow: none;
        box-shadow: none;
        outline: none;
    }

    font-size: 1rem;
`
