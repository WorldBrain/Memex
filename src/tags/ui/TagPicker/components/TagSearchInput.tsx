import React, { ChangeEvent } from 'react'
import styled from 'styled-components'
import { colorGrey3 } from 'src/common-ui/components/design-library/colors'
import { Search as SearchIcon } from '@styled-icons/feather'

interface Props {
    onChange: (value: string) => void
    value: string
    before: any
}

interface State {
    isFocused: boolean
}
export class TagSearchInput extends React.Component<Props, State> {
    state = { isFocused: false }
    onChange = (e: ChangeEvent<HTMLInputElement>) =>
        this.props.onChange(e.target.value)

    render() {
        return (
            <SearchBox isFocused={this.state.isFocused}>
                <StyledSearchIcon size={24} />
                {this.props.before}
                <SearchInput
                    value={this.props.value}
                    onChange={this.onChange}
                    onFocus={() => this.setState({ isFocused: true })}
                    onBlur={() => this.setState({ isFocused: false })}
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
    background-color: ${props => props.theme.inputBackground};
    border: 2px solid;
    border-color: ${props => (props.isFocused ? colorGrey3 : 'transparent')};
    border-radius: 3px;
    color: ${props => props.theme.text};
    display: flex;
    flex-wrap: wrap;
    font-size: 1rem;
    padding: 2px 8px;
    transition: border 0.2s;
    margin-bottom: 1px;
`

const SearchInput = styled.input`
    border: none;
    background-image: none;
    background-color: transparent;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    box-shadow: none;
    color: ${props => props.theme.text};

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
