import React, { PureComponent } from 'react'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'

import { DropdownMenuBtn } from 'src/common-ui/components/dropdown-menu-btn'
import { NotesType } from '../types'
import { notesTypeToString, stringToNotesType } from '../util'

export interface Props {
    notesTypeSelection: NotesType
    onNotesTypeSelection(selection: NotesType): void
}

export default class NotesTypeDropdownMenu extends PureComponent<Props> {
    render() {
        return (
            <DropdownMenuBtn
                keepSelectedState
                initSelectedIndex={0}
                onMenuItemClick={({ name }) =>
                    this.props.onNotesTypeSelection(stringToNotesType(name))
                }
                btnChildren={
                    <>
                        <ButtonText>
                            {notesTypeToString(this.props.notesTypeSelection)}
                        </ButtonText>
                        <IconImg src={icons.triangle} />
                    </>
                }
                menuItems={[
                    // {
                    //     name: notesTypeToString('search'),
                    //     info: 'Notes that match the search results',
                    // },
                    {
                        name: notesTypeToString('user'),
                        info: 'All notes you made on this page',
                    },
                    {
                        name: notesTypeToString('followed'),
                        info: 'Notes from collections you follow',
                        isDisabled: true,
                        soonAvailable: true,
                    },
                ]}
            />
        )
    }
}

const ButtonText = styled.div`
    font-size: 12px;
    font-weight: bold;
`

const IconImg = styled.img`
    height: 22px;
    width: 22px;
    padding: 6px 6px 6px 2px;
`
