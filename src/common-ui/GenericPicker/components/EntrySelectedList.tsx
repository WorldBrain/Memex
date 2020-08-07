import React, { ChangeEvent } from 'react'
import styled from 'styled-components'
import { X as XIcon } from '@styled-icons/feather'

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
                        {entry}
                        <StyledXIcon size={12} />
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
