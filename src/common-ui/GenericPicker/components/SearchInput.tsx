import React from 'react'
import styled from 'styled-components'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'
import { Loader, Search as SearchIcon } from '@styled-icons/feather'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'
import { KeyEvent } from '../types'

interface Props {
    onChange: (value: string) => void
    onKeyPress: (key: KeyEvent) => void
    searchInputPlaceholder: string
    value: string
    before: JSX.Element
    searchInputRef?: (e: HTMLTextAreaElement | HTMLInputElement) => void
    showPlaceholder?: boolean
    loading?: boolean
}

interface State {
    isFocused: boolean
}

export const keyEvents: KeyEvent[] = [
    'Enter',
    'Tab',
    'ArrowUp',
    'ArrowDown',
    'Escape',
    ',',
    // TODO: adding backspace as a special handler here prevents regular backspace in the field.
    // if we want to delete entries on backspace, perhaps the controlled text input needs to check
    // the handler return function to know whether to prevent it's default or proceed with it.
    // 'Backspace',
]

export class PickerSearchInput extends React.Component<Props, State> {
    state = { isFocused: false }

    onChange = (value: string) => this.props.onChange(value)

    handleSpecialKeyPress = {
        test: (e: KeyboardEvent) => keyEvents.includes(e.key as KeyEvent),
        handle: (e: KeyboardEvent) => this.props.onKeyPress(e.key as KeyEvent),
    }

    render() {
        return (
            <SearchBox isFocused={this.state.isFocused} id={'pickerSearchBox'}>
                {this.props.before}
                <SearchInput
                    placeholder={
                        this.props.showPlaceholder ?? true
                            ? this.props.searchInputPlaceholder
                            : ''
                    }
                    defaultValue={this.props.value}
                    onChange={this.onChange}
                    onKeyDown={(e) => e.stopPropagation()}
                    onFocus={() => this.setState({ isFocused: true })}
                    onBlur={() => this.setState({ isFocused: false })}
                    specialHandlers={[this.handleSpecialKeyPress]}
                    type={'input'}
                    updateRef={this.props.searchInputRef}
                    autoFocus
                    size="5"
                />
                {this.props.loading && <Loader size={20} />}
            </SearchBox>
        )
    }
}

const StyledSearchIcon = styled(SearchIcon)`
    color: ${(props) => props.theme.tag.searchIcon};
    stroke-width: 2px;
    margin-right: 8px;
`

const SearchBox = styled.div`
    align-items: center;
    background-color: ${(props) => props.theme.inputBackground};
    border-radius: 3px;
    color: ${(props) => props.theme.text};
    display: flex;
    flex-wrap: wrap;
    font-size: 1rem;
    padding: 3px 8px;
    margin-left: 8px;
    margin-right: 8px;
    transition: border 0.1s;
    margin-bottom: 4px;
`

const SearchInput = styled(TextInputControlled)`
    border: none;
    background-image: none;
    background-color: transparent;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    box-shadow: none;
    display: flex;
    flex: 1;
    color: ${(props) => props.theme.text};
    font-family: 'Poppins', sans-serif;
    font-size: ${fontSizeSmall}px;
    min-height: 24px;

    &:focus {
        border: none;
        outline: none;
        -webkit-box-shadow: none;
        -moz-box-shadow: none;
        box-shadow: none;
    }
`
