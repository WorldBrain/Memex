import React, { ChangeEvent } from 'react'
import styled from 'styled-components'
import { X as XIcon } from '@styled-icons/feather'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'

interface Props {
    dataAttributeName: string
    entriesSelected: string[]
    onPress: (entry: string) => void | Promise<void>
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
                    <ActiveEntry
                        key={`ActiveTab-${entry}`}
                        onClick={this.handleSelectedTabPress}
                        {...{ [this.dataAttribute]: entry }} // Need to set a dynamic prop here
                    >
                        <Entry>{entry}</Entry>
                        <StyledXIcon size={12} />
                    </ActiveEntry>
                ))}
            </React.Fragment>
        )
    }
}

export const ActiveEntry = styled.div`
    display: inline-flex;
    cursor: pointer;
    max-width: 100%;
    align-items: center;
    background: ${(props) => props.theme.tag.selected};
    border: 2px solid ${(props) => props.theme.tag.tag};
    border-radius: 4px;
    color: ${(props) => props.theme.tag.text};
    font-size: ${fontSizeSmall}px;
    font-weight: 400;
    padding: 0 4px 0 8px;
    margin: 2px 4px 2px 0;
    transition: background 0.3s;
    word-break: break-word;

    &:hover {
        cursor: pointer;
    }
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
