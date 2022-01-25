import React from 'react'
import styled from 'styled-components'
import { X as XIcon } from '@styled-icons/feather'
import { ActiveList } from 'src/custom-lists/ui/CollectionPicker/components/ActiveList'

interface Props {
    entries: Array<{ localId: number; name: string }>
    onPress: (entryId: number) => void
}

export class EntrySelectedList extends React.PureComponent<Props> {
    handleSelectedTabPress = (listId: number): React.MouseEventHandler => (
        event,
    ) => {
        this.props.onPress(listId)
    }

    render() {
        return (
            <React.Fragment>
                {this.props.entries?.map((entry) => (
                    <StyledActiveEntry
                        key={`ActiveTab-${entry.localId}`}
                        onClick={this.handleSelectedTabPress(entry.localId)}
                    >
                        <Entry>{entry.name}</Entry>
                        <StyledXIcon size={12} />
                    </StyledActiveEntry>
                ))}
            </React.Fragment>
        )
    }
}

const StyledActiveEntry = styled(ActiveList)`
    display: inline-flex;
    cursor: pointer;
    max-width: 100%;
`

const Entry = styled.div`
    display: block;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
`

const StyledXIcon = styled(XIcon)`
    stroke: ${(props) => props.theme.tag.text};
    stroke-width: 2px;
    margin-left: 4px;
    display: flex;
    flex-shrink: 0;
    pointer-events: none;

    &:hover {
        stroke-width: 3px;
        stroke: darken(0.2, ${(props) => props.theme.tag.text});
    }
`
