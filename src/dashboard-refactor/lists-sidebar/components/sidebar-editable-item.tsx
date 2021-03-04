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

    private handleConfirm: React.MouseEventHandler = () =>
        this.props.onConfirmClick(this.state.value)

    private handleCancel: React.MouseEventHandler = () =>
        this.props.onCancelClick(this.state.value)

    render() {
        return (
            <>
                <Container>
                    <Margin left="19px">
                        <EditableListTitle
                            onChange={this.handleChange}
                            value={this.state.value}
                        />
                    </Margin>
                    <Margin right="7.5px">
                        <ActionBtn onClick={this.handleConfirm}>
                            <Icon src={icons.check} />
                        </ActionBtn>
                        <ActionBtn onClick={this.handleCancel}>
                            <Icon src={icons.close} />
                        </ActionBtn>
                    </Margin>
                </Container>
                {this.props.errorMessage && (
                    <ErrMsg>{this.props.errorMessage}</ErrMsg>
                )}
            </>
        )
    }
}

const EditableListTitle = styled.input<Props>``

const ActionBtn = styled.button``

const Icon = styled.img`
    height: 15px;
    width: 15px;
`

const ErrMsg = styled.span`
    color: red;
`

const Container = styled.div<Props>`
    height: 27px;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background-color: transparent;

    &:hover {
        background-color: ${colors.onHover};
    }
`
