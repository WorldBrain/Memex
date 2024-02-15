import React, { ChangeEventHandler } from 'react'
import styled, { css } from 'styled-components'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'
import { KeyEvent } from '../types'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'

interface Props {
    onChange: (value: string) => void
    onKeyPress: (key: KeyEvent) => void
    searchInputPlaceholder: string
    value: string
    before?: JSX.Element
    searchInputRef?: React.RefObject<HTMLInputElement>
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

    searchInputRef = React.createRef<HTMLTextAreaElement | HTMLInputElement>()

    onChange: ChangeEventHandler = (e) =>
        this.props.onChange((e.target as HTMLInputElement).value)

    handleSpecialKeyPress = {
        test: (e: KeyboardEvent) => keyEvents.includes(e.key as KeyEvent),
        handle: (e: KeyboardEvent) => this.props.onKeyPress(e.key as KeyEvent),
    }

    render() {
        return (
            <SearchInput
                id={'pickerSearchBox'}
                placeholder={this.props.searchInputPlaceholder}
                value={this.props.value}
                onChange={this.onChange}
                onKeyDown={(e) => {
                    this.props.onKeyPress(e.key as KeyEvent),
                        e.stopPropagation()
                }}
                type={'input'}
                componentRef={this.props.searchInputRef}
                autoFocus
            />
        )
    }
}

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

    &:focus {
        border: none;
        outline: none;
        -webkit-box-shadow: none;
        -moz-box-shadow: none;
        box-shadow: none;
    }
`
