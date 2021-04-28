import React from 'react'
import styled from 'styled-components'

import colors from 'src/dashboard-refactor/colors'
import Margin from 'src/dashboard-refactor/components/Margin'
import * as icons from 'src/common-ui/components/design-library/icons'

interface State {
    value: string
}

export interface Props {
    initValue?: string
    errorMessage: string | null
    onCancelClick: (value: string) => void
    onConfirmClick: (value: string) => void
}

export default class ListsSidebarEditableItem extends React.PureComponent<
    Props,
    State
> {
    static defaultProps: Partial<Props> = { initValue: '' }
    state: State = { value: this.props.initValue }

    private handleChange: React.MouseEventHandler<HTMLInputElement> = (event) =>
        this.setState({ value: (event.target as HTMLInputElement).value })

    private handleInputKeyDown: React.KeyboardEventHandler = (e) => {
        // Allow escape keydown to bubble up to close the sidebar only if no input state
        if (e.key === 'Escape') {
            if (this.state.value.length) {
                e.stopPropagation()
            }
            this.props.onCancelClick(this.state.value)
            return
        }

        if (e.key === 'Enter') {
            this.props.onConfirmClick(this.state.value)
        }

        // If we don't have this, events will bubble up into the page!
        e.stopPropagation()
    }

    private handleConfirm: React.MouseEventHandler = () =>
        this.props.onConfirmClick(this.state.value)

    private handleCancel: React.MouseEventHandler = () =>
        this.props.onCancelClick(this.state.value)

    render() {
        return (
            <>
                <Container>
                    <EditableListTitle
                        autoFocus
                        onChange={this.handleChange}
                        value={this.state.value}
                        onKeyDown={this.handleInputKeyDown}
                    />
                    <ActionButtonBox left="5px">
                        <ActionBtn onClick={this.handleConfirm}>
                            <Icon src={icons.check} />
                        </ActionBtn>
                        <ActionBtn onClick={this.handleCancel}>
                            <Icon src={icons.close} />
                        </ActionBtn>
                    </ActionButtonBox>
                </Container>
                {this.props.errorMessage && (
                    <ErrMsg>{this.props.errorMessage}</ErrMsg>
                )}
            </>
        )
    }
}

const EditableListTitle = styled.input`
    border: 1px solid #e0e0e0;
    padding: 2px 5px;
    border-radius: 3px;
    outline: none;
    background: white;
    flex: 2;
    display: flex;
    min-width: 50px;
    margin-right: 0px;
    font-size: 12px;
`

const ActionButtonBox = styled(Margin)`
    display: flex;
    flex: 1;
`

const ActionBtn = styled.div`
    border: none;
    background: none;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    outline: none;
    height: 24px;
    width: 24px;

    > img {
        height: 12px;
        width: auto;
        outline: none;
    }

    &:hover {
        background: #e0e0e0;
    }
`

const Icon = styled.img`
    height: 15px;
    width: 15px;
`

const ErrMsg = styled.span`
    color: red;
`

const Container = styled.div<Props>`
    height: 30px;
    width: 100%;
    padding-left: 15px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background-color: transparent;

    &:hover {
        background-color: ${colors.onHover};
    }
`
