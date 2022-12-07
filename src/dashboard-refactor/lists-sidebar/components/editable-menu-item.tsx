import React from 'react'
import styled from 'styled-components'

export interface Props {
    nameValue: string
    errorMessage: string | null
    onCancelClick: (shouldSave: boolean) => void
    onConfirmClick: (value: string) => void
    changeListName?: (value: string) => void
    onNameChange: (value: string) => void
    onRenameStart?: React.MouseEventHandler<Element>
    confirmWithEnter?: () => void
}

export interface State {
    spaceTitle: string
}

export default class EditableMenuItem extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.props.onRenameStart?.(null)
    }

    state = {
        spaceTitle: this.props.nameValue,
    }

    private handleChange: React.KeyboardEventHandler = (event) => {
        const value = (event.target as HTMLInputElement).value
        this.props.onNameChange(value)
        this.props.changeListName?.(value)
        console.log('value', value)

        this.setState({
            spaceTitle: value,
        })
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

        console.log('spacetime:', this.state.spaceTitle)

        if (e.key === 'Enter') {
            if (this.state.spaceTitle.length) {
                this.props.confirmWithEnter()
                console.log('confirm')
                e.stopPropagation()
                this.props.onConfirmClick(this.state.spaceTitle)
            }
        }

        // If we don't have this, events will bubble up into the page!
        e.stopPropagation()
    }

    render() {
        return (
            <>
                <Container
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                >
                    <EditableListTitle
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                        }}
                        onChange={this.handleChange}
                        value={this.state.spaceTitle}
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
    border-radius: 5px;
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
    color: ${(props) => props.theme.colors.darkerText};
    background: ${(props) => props.theme.colors.darkhover};

    &:focus {
        outline: 1px solid ${(props) => props.theme.colors.lineGrey};
        color: ${(props) => props.theme.colors.normalText};
    }
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
`
