import React, { ChangeEventHandler } from 'react'
import styled, { css } from 'styled-components'
import type { KeyEvent } from 'src/common-ui/GenericPicker/types'
import browser from 'webextension-polyfill'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'

const search = browser.runtime.getURL('/img/search.svg')

interface Props {
    onChange: (value: string) => void
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void // Adjusted type here
    onKeyUp: (e: React.KeyboardEvent<HTMLInputElement>) => void // Adjusted type here
    searchInputPlaceholder: string
    value: string
    searchInputRef?: React.RefObject<HTMLInputElement>
    showPlaceholder?: boolean
    loading?: boolean
    autoFocus?: boolean
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

    onChange: ChangeEventHandler = (e) =>
        this.props.onChange((e.target as HTMLInputElement).value)

    render() {
        return (
            <SearchInput
                placeholder={
                    this.props.searchInputPlaceholder
                        ? this.props.searchInputPlaceholder
                        : 'Search & Add Spaces'
                }
                value={this.props.value}
                onChange={this.onChange}
                onKeyDown={(e) => {
                    this.props.onKeyDown(e)
                    e.stopPropagation()
                }}
                onKeyUp={(e) => {
                    this.props.onKeyUp(e)
                    e.stopPropagation()
                }}
                type={'input'}
                componentRef={this.props.searchInputRef}
                icon="searchIcon"
                autoFocus={
                    this.props.autoFocus != null ? this.props.autoFocus : true
                }
                id={'pickerSearchBox'}
            />
        )
    }
}

const SearchBox = styled.div<{ isFocused: boolean }>`
    align-items: center;
    background-color: ${(props) => props.theme.colors.greyScale2};
    border-radius: 3px;
    color: ${(props) => props.theme.colors.white};
    display: flex;
    flex-wrap: wrap;
    font-size: 1rem;
    padding: 10px;
    transition: border 0.1s;
    margin-bottom: 4px;
    grid-gap: 5px;
    min-height: 20px;
    margin: 10px 10px 0px 10px;

    ${(props) =>
        props.isFocused &&
        css`
            outline: 1px solid ${(props) => props.theme.colors.lineGrey};
        `}
`

const SearchInput = styled(TextField)`
    border: none;
    background-image: none;
    background-color: transparent;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    box-shadow: none;
    display: flex;
    flex: 1;
    color: ${(props) => props.theme.colors.white};
    font-family: 'Satoshi', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on,
        'liga' off;
    font-size: 14px;
    height: fill-available;
    width: fill-available;

    & * {
        font-family: 'Satoshi', sans-serif;
        font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on,
            'ss04' on, 'liga' off;
    }

    &:focus {
        border: none;
        outline: none;
        -webkit-box-shadow: none;
        -moz-box-shadow: none;
        box-shadow: none;
    }

    &:focus ${SearchBox} {
        border: 1px solid ${(props) => props.theme.colors.lineGrey};
    }
`
