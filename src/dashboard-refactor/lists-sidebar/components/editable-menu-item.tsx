import React from 'react'
import styled from 'styled-components'

import colors from 'src/dashboard-refactor/colors'
import Margin from 'src/dashboard-refactor/components/Margin'
import * as icons from 'src/common-ui/components/design-library/icons'

interface State {
    value: string
}
interface NameValueState {
    value: string
    setValue: (string) => void
}
export interface Props {
    initValue?: string
    errorMessage: string | null
    onCancelClick: (value: string) => void
    onConfirmClick: (value: string) => void
    changeListName: (value: string) => void
    onRenameStart?: React.MouseEventHandler<Element>
}

export default class EditableMenuItem extends React.PureComponent<
    Props & { nameValueState: NameValueState },
    State
> {
    static defaultProps: Partial<Props> = { initValue: '' }
    // state: State = { value: this.props.initValue }
    constructor(props: Props & { nameValueState: NameValueState }) {
        super(props)
        this.props.onRenameStart(null)
    }
    componentDidMount() {
        console.log('componentDidMount', { state: this.state })
    }

    componentWillUnmount(): void {
        console.log('componentWillUnmount', { state: this.state })
    }
    private handleChange: React.MouseEventHandler<HTMLInputElement> = (
        event,
    ) => {
        const value = (event.target as HTMLInputElement).value
        this.props.nameValueState.setValue(value)
        this.props.changeListName(value)
    }

    private handleInputKeyDown: React.KeyboardEventHandler = (e) => {
        // Allow escape keydown to bubble up to close the sidebar only if no input state
        if (e.key === 'Escape') {
            console.log('handleInputKeyDown Escape', { e })
            if (this.props.nameValueState.value.length) {
                e.stopPropagation()
            }
            this.props.onCancelClick(this.props.nameValueState.value)
            return
        }

        if (e.key === 'Enter') {
            console.log('handleInputKeyDown Enter', { e })
            if (this.props.nameValueState.value.length) {
                e.stopPropagation()
                this.props.onConfirmClick(this.props.nameValueState.value)
            }
        }

        // If we don't have this, events will bubble up into the page!
        e.stopPropagation()
    }

    private handleConfirm: React.MouseEventHandler = () =>
        this.props.onConfirmClick(this.props.nameValueState.value)

    private handleCancel: React.MouseEventHandler = () =>
        this.props.onCancelClick(this.props.nameValueState.value)

    render() {
        return (
            <>
                <Container onClick={(e) => e.stopPropagation()}>
                    <EditableListTitle
                        onChange={this.handleChange}
                        value={this.props.nameValueState.value}
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
    height: 50px;
    outline: none;
    border: none;
    width: fill-available;
    color: ${(props) => props.theme.colors.normalText};
    background-color: ${(props) => props.theme.colors.backgroundColorDarker};
`

const ErrMsg = styled.div`
color: red;
width: 100 %;
text - align: center;
margin - top: -5px;
margin - bottom: 5px;
`

const Container = styled.div<Props>`
height: 50px;
width: fill - available;
display: flex;
flex - direction: column;
justify - content: center;
align - items: flex - start;
background - color: transparent;
padding: 10px;
margin - bottom: 5px;
margin - top: 5px;
`
