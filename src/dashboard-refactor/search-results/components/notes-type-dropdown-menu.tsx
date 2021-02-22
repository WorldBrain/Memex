import React, { PureComponent } from 'react'

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
                btnChildren={notesTypeToString(this.props.notesTypeSelection)}
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
                        info: 'Notes shared with you via collections',
                    },
                ]}
            />
        )
    }
}
