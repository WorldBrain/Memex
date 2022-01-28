import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { ButtonTooltip } from 'src/common-ui/components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'

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
                {!this.props.isEnabled ? (
                    <ButtonTooltip
                        tooltipText="Expand all annotations"
                        position="bottom"
                    >
                        <IconBox>
                            <Icon
                                filePath={icons.expand}
                                height="16px"
                                color="primary"
                            />
                        </IconBox>
                    </ButtonTooltip>
                ) : (
                    <ButtonTooltip
                        tooltipText="Collapse all annotations"
                        position="bottom"
                    >
                        <IconBox>
                            <Icon
                                filePath={icons.compress}
                                height="16px"
                                color="primary"
                            />
                        </IconBox>
                    </ButtonTooltip>
                )}
            </ExpandAllNotesBtn>
        )
    }
}

const IconBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 3px;
    padding: 4px;

    &:hover {
        background-color: ${(props) => props.theme.colors.grey};
    }
`

const ExpandAllNotesBtn = styled.button`
    color: ${colors.darkBlue};
    font-weight: 600;
    cursor: pointer;
    outline: none;
    display: flex;
    border: none;
    width: 24px;
    align-items: center;
    background-color: transparent;
    justify-content: center;
`
