import React, { ChangeEvent } from 'react'
import styled from 'styled-components'
import { X as XIcon } from '@styled-icons/feather'
import { ActiveList } from 'src/custom-lists/ui/CollectionPicker/components/ActiveList'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

interface Props {
    dataAttributeName: string
    entriesSelected: string[]
    onPress: (entry: string) => void
}

export class EntrySelectedList extends React.PureComponent<Props> {
    private get dataAttribute(): string {
        return `data-${this.props.dataAttributeName}`
    }

    handleSelectedTabPress = (event: ChangeEvent) =>
        this.props.onPress(event.target.getAttribute(this.dataAttribute))

    render() {
        return (
            <React.Fragment>
                {this.props.entriesSelected?.map((entry) => (
                    <StyledActiveEntry
                        key={`ActiveTab-${entry}`}
                        onClick={this.handleSelectedTabPress}
                        {...{ [this.dataAttribute]: entry }} // Need to set a dynamic prop here
                    >
                        <Entry>{entry}</Entry>
                        <Icon heightAndWidth={'10px'} filePath={icons.close} />
                    </StyledActiveEntry>
                ))}
            </React.Fragment>
        )
    }
}

const StyledActiveEntry = styled(ActiveList)`
    display: inline-flex;
    cursor: pointer;
    min-height: 18px;
    padding: 2px 8px;
    &:hover {
        background: ${(props) => props.theme.colors.darkhover};
    }
`

const Entry = styled.div`
    display: block;
    text-overflow: ellipsis;
    white-space: break-spaces;
    overflow-x: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    color: ${(props) => props.theme.colors.normalText};
`
