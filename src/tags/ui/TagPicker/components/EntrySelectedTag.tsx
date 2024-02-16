import React, { ChangeEvent } from 'react'
import styled from 'styled-components'
import { ActiveTag } from './ActiveTag'

interface Props {
    dataAttributeName: string
    entriesSelected: string[]
    onPress: (entry: string) => void
}

export class EntrySelectedTag extends React.PureComponent<Props> {
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
                        {...{ [this.dataAttribute]: entry }} // Need to set a dynamic prop here
                    >
                        {entry}
                    </StyledActiveEntry>
                ))}
            </React.Fragment>
        )
    }
}

const StyledActiveEntry = styled(ActiveTag)`
    display: grid;
    grid-auto-flow: column;
    grid-gap: 5px;
    align-items: center;
    cursor: pointer;
`
