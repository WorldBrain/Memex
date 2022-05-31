import React from 'react'
import styled from 'styled-components'

export interface Props {
    nameValue: string
    errorMessage: string | null
    onCancelClick: (shouldSave: boolean) => void
    onConfirmClick: (value: string) => void
    changeListName?: (value: string) => void
    onRenameStart?: React.MouseEventHandler<Element>
    onNameChange: (value: string) => void
}

export default class EditableMenuItem extends React.PureComponent<Props> {
    // state: State = { value: this.props.initValue }
    constructor(props: Props) {
        super(props)
        this.props.onRenameStart?.(null)
    }

    private handleChange: React.MouseEventHandler<HTMLInputElement> = (
        event,
    ) => {
        const value = (event.target as HTMLInputElement).value
        this.props.onNameChange(value)
        this.props.changeListName?.(value)
    }

    private handleInputKeyDown: React.KeyboardEventHandler = (e) => {
        // Allow escape keydown to bubble up to close the sidebar only if no input state
        if (e.key === 'Escape') {
            if (this.props.nameValue.length) {
                e.stopPropagation()
            }
            this.props.onCancelClick(false)
            return
        }

        if (e.key === 'Enter') {
            if (this.props.nameValue.length) {
                e.stopPropagation()
                this.props.onConfirmClick(this.props.nameValue)
            }
        }

        // If we don't have this, events will bubble up into the page!
        e.stopPropagation()
    }

    render() {
        return (
            <>
                <Container onClick={(e) => e.stopPropagation()}>
                    <EditableListTitle
                        onChange={this.handleChange}
                        value={this.props.nameValue}
                        onKeyDown={this.handleInputKeyDown}
                    />
                </Container>
                {this.props.errorMessage && (
                    <ErrMsg>{this.props.errorMessage}</ErrMsg>
                )}
            </>
        )
    }
}

const EditableListTitle = styled.input`
    padding: 2px 10px;
    border-radius: 3px;
    outline: none;
    background: white;
    flex: 2;
    display: flex;
    min-width: 50px;
    margin-right: 0px;
    font-size: 14px;
    height: 40px;
    outline: none;
    border: none;
    width: fill-available;
    color: ${(props) => props.theme.colors.normalText};
    background-color: ${(props) => props.theme.colors.backgroundColorDarker};
`

const ErrMsg = styled.div`
    color: red;
    width: 100%;
    text-align: center;
    margin-top: -5px;
    margin-bottom: 5px;
`

const Container = styled.div<Props>`
    height: 40px;
    width: fill-available;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    background-color: transparent;
    padding: 10px;
    margin-bottom: 5px;
    margin-top: 5px;
`
