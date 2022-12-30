import * as React from 'react'
import styled, { css } from 'styled-components'

import { TextTruncator } from 'src/annotations/types'
import { truncateText } from 'src/annotations/utils'
import * as icons from 'src/common-ui/components/design-library/icons'

import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import memexStorex from 'src/search/memex-storex'

export interface Props {
    text: string
    truncateText?: TextTruncator
    children: (props: { text: string }) => JSX.Element
    isHighlight?: boolean
}

interface State {
    isTruncated: boolean
    truncatedText: string
    needsTruncation: boolean
}

class TextTruncated extends React.Component<Props, State> {
    static defaultProps: Partial<Props> = { text: '', truncateText }

    constructor(props: Props) {
        super(props)

        const { isTooLong, text } = this.props.truncateText(this.props.text)
        this.state = {
            isTruncated: isTooLong,
            needsTruncation: isTooLong,
            truncatedText: text,
        }
    }

    componentDidUpdate(prevProps: Props) {
        if (this.props.text !== prevProps.text) {
            const { isTooLong, text } = this.props.truncateText(this.props.text)
            this.setState({
                isTruncated: isTooLong,
                needsTruncation: isTooLong,
                truncatedText: text,
            })
        }
    }

    private toggleTextTruncation: React.MouseEventHandler = (e) => {
        e.stopPropagation()
        this.setState((prevState) => ({ isTruncated: !prevState.isTruncated }))
    }

    render() {
        const text = this.state.isTruncated
            ? this.state.truncatedText
            : this.props.text

        const textArray = text
            .split(/\r?\n|\r|\n/g)
            .filter((item) => item.length > 0)

        return (
            <TruncatedBox isHighlight={this.props.isHighlight}>
                {this.props.isHighlight
                    ? textArray.map((line) => (
                          <TextContent isHighlight={this.props.isHighlight}>
                              <span>{line}</span>
                          </TextContent>
                      ))
                    : this.props.children({ text })}
                <ToggleMoreBox>
                    {this.state.needsTruncation && (
                        <ToggleMoreButtonStyled
                            onClick={this.toggleTextTruncation}
                            isHighlight={this.props.isHighlight}
                        >
                            <Icon
                                filePath={
                                    this.state.isTruncated
                                        ? icons.expand
                                        : icons.compress
                                }
                                heightAndWidth={'16px'}
                                hoverOff
                            />
                            {this.state.isTruncated ? 'Show More' : 'Show Less'}
                        </ToggleMoreButtonStyled>
                    )}
                </ToggleMoreBox>
            </TruncatedBox>
        )
    }
}

const TextContent = styled.div<{ isHighlight: boolean }>`
    display: inline;
    ${(props) =>
        props.isHighlight &&
        css`
            & > span {
                box-decoration-break: clone;
                overflow: hidden;
                line-height: 24px;
                font-style: normal;
                border-radius: 3px;
                background-color: ${(props) =>
                    props.theme.colors.highlightColorDefault};
                color: ${(props) => props.theme.colors.black};
                padding: 2px 5px;
            }
        `};
`

const TruncatedBox = styled.div<{ isHighlight: boolean }>`
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: flex-end;
    grid-gap: 5px;
`

const ToggleMoreButtonStyled = styled.div<{ isHighlight: boolean }>`
    margin: 2px 0 0 0px;
    cursor: pointer;
    padding: 0px 5px;
    border-radius: 3px;
    font-size: 12px;
    color: grey;
    line-height: 18px;
    color: ${(props) => props.theme.colors.lighterText};
    display: flex;
    grid-gap: 5px;
    align-items: center;
    background-color: ${(props) => props.theme.colors.backgroundColorDarker};
    margin-top: -10px;
    height: 24px;

    &:hover {
        background-color: ${(props) => props.theme.colors.lightHover};
    }

    & * {
        cursor: pointer;
    }

    ${(props) =>
        props.isHighlight &&
        css`
            margin-top: -28px;
        `};
`

const ToggleMoreBox = styled.div`
    display: flex;
    flex-direction: row;
    justify-self: flex-end;
    align-self: flex-end;
    position: relative;
    cursor: pointer;
`

export default TextTruncated
