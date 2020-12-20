import React from 'react'
import styled from 'styled-components'

import colors from 'src/dashboard-refactor/colors'
import Margin from 'src/dashboard-refactor/components/Margin'
import * as icons from 'src/common-ui/components/design-library/icons'

export interface Props {
    value: string
    onChange: (value: string) => void
    onCancelClick: React.MouseEventHandler
    onConfirmClick: React.MouseEventHandler
}

export default class ListsSidebarEditableItem extends React.PureComponent<
    Props
> {
    render() {
        return (
            <Container>
                <Margin left="19px">
                    <EditableListTitle
                        onChange={this.props.onChange}
                        value={this.props.value}
                    />
                </Margin>
                <Margin right="7.5px">
                    <ActionBtn onClick={this.props.onConfirmClick}>
                        <Icon src={icons.check} />
                    </ActionBtn>
                    <ActionBtn onClick={this.props.onCancelClick}>
                        <Icon src={icons.close} />
                    </ActionBtn>
                </Margin>
            </Container>
        )
    }
}

const EditableListTitle = styled.input<Props>``

const ActionBtn = styled.button``

const Icon = styled.img``

const Container = styled.div<Props>`
    height: 27px;
    width: 173px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background-color: transparent;

    &:hover {
        background-color: ${colors.onHover};
    }
`
