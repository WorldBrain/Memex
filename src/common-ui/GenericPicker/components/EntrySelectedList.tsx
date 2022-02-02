import React, { ChangeEvent } from 'react'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

interface Props {
    dataAttributeName: string
    entriesSelected: string[]
    ActiveEntry: typeof React.Component
    onPress: (entry: string) => void
}

export class EntrySelectedList extends React.PureComponent<Props> {
    private get dataAttribute(): string {
        return `data-${this.props.dataAttributeName}`
    }

    handleSelectedTabPress = (event: ChangeEvent) =>
        this.props.onPress(event.target.getAttribute(this.dataAttribute))

    render() {
        const StyledActiveEntry = createStyledActiveEntry(
            this.props.ActiveEntry,
        )

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

const createStyledActiveEntry = (ActiveEntry: typeof React.Component) => styled(
    ActiveEntry,
)`
    display: inline-flex;
    cursor: pointer;
    height: 18px;
    padding: 0 3px;
`

const Entry = styled.div`
    display: block;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    color: ${(props) => props.theme.colors.darkerText};

    &:hover {
        background: ${(props) => props.theme.colors.darkhover};
    }
`
