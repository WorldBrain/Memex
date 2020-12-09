import React, { ChangeEvent } from 'react'
import styled from 'styled-components'
import { X as XIcon } from '@styled-icons/feather'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'

interface Props {
    dataAttributeName: string
    entriesSelected: string[]
    onPress: (entry: string) => void
}

export class EntrySelectedDomain extends React.PureComponent<Props> {
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
                        {entry}
                        <StyledXIcon size={12} />
                    </StyledActiveEntry>
                ))}
            </React.Fragment>
        )
    }
}

const ActiveDomain = styled.div`
    align-items: center;
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
        background-color: #dadada;
    }
`

const StyledActiveEntry = styled(ActiveDomain)`
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
