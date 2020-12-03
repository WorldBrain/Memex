import React, { PureComponent } from 'react'

import { DropdownMenuBtn } from 'src/common-ui/components/dropdown-menu-btn'
import { NotesType } from '../types'
import { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'

export interface Props {
    notesTypeSelection: NotesType
    onNotesTypeSelection(selection: NotesType): void
}

export default class NotesTypeDropdownMenu extends PureComponent<Props> {
    render() {
        return (
            <DropdownMenuBtn
                keepSelectedState
                initSelectedIndex={1}
                onMenuItemClick={({ name }) =>
                    this.props.onNotesTypeSelection(name as NotesType)
                }
                btnChildren="Results"
                menuItems={[
                    {
                        name: 'Results',
                        info: 'Notes that match the search results',
                    },
                    {
                        name: 'Your notes',
                        info: 'All notes you made on this page',
                    },
                    {
                        name: 'Shared with you',
                        info: 'Notes shared with you via collections',
                    },
                ]}
            />
        )
    }
}
