import React, { ChangeEvent } from 'react'
import styled from 'styled-components'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

interface Props {
    dataAttributeName: string
    entriesSelected: string[]
    onPress: (entry: string) => void | Promise<void>
}

export class EntrySelectedList extends React.PureComponent<Props> {
    private get dataAttribute(): string {
        return `data-${this.props.dataAttributeName}`
    }

    handleSelectedTabPress = (event: React.MouseEvent<HTMLDivElement>) =>
        this.props.onPress(event.currentTarget.getAttribute(this.dataAttribute))

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
                        <Icon
                            heightAndWidth={'10px'}
                            filePath={icons.removeX}
                        />
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
    margin: 2px 4px 2px 0;
    transition: background 0.3s;
    word-break: break-word;

    &:hover {
        cursor: pointer;
    }
    height: 18px;
    padding: 0 3px;
`

const Entry = styled.div`
    display: block;
    text-overflow: ellipsis;
    white-space: break-spaces;
    overflow-x: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    color: ${(props) => props.theme.colors.darkerText};

    &:hover {
        background: ${(props) => props.theme.colors.greyScale2};
    }
`
