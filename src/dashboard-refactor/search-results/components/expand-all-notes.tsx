import React, { PureComponent } from 'react'
import styled from 'styled-components'

import colors from 'src/dashboard-refactor/colors'

export interface Props {
    onClick: React.MouseEventHandler<HTMLButtonElement>
    isEnabled: boolean
}

export default class ExpandAllNotes extends PureComponent<Props> {
    private get btnText(): string {
        return this.props.isEnabled ? 'Collapse Notes' : 'Expand Notes'
    }

    render() {
        return (
            <ExpandAllNotesBtn onClick={this.props.onClick}>
                {this.btnText}
            </ExpandAllNotesBtn>
        )
    }
}

const ExpandAllNotesBtn = styled.button`
    color: ${colors.darkBlue};
    font-weight: 600;
    cursor: pointer;
    outline: none;
    padding: 2px 8px 2px 8px;
    display: flex;
    border: none;
    align-items: center;
    background-color: transparent;
    justify-content: center;

    &:focus {
        background-color: ${colors.lightMintGreen};
    }
`
