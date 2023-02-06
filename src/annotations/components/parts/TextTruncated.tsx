import * as React from 'react'
import styled, { css } from 'styled-components'

import { TextTruncator } from 'src/annotations/types'
import { truncateText } from 'src/annotations/utils'
import * as icons from 'src/common-ui/components/design-library/icons'

import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import memexStorex from 'src/search/memex-storex'
import Markdown from '@worldbrain/memex-common/lib/common-ui/components/markdown'

export interface Props {
    text: string
    truncateText?: TextTruncator
    isHighlight?: boolean
    toggleTextTruncate?: () => void
    isTruncated?: boolean
    needsTruncation: boolean
    truncatedText: string
    pageUrl?: string
}

interface State {
    isTruncated: boolean
    truncatedText: string
    needsTruncation: boolean
}

class TextTruncated extends React.Component<Props, State> {
    // static defaultProps: Partial<Props> = { text: '', truncateText }

    constructor(props: Props) {
        super(props)
    }

    componentDidUpdate(prevProps: Props) {
        // if (this.props.text !== prevProps.text) {
        //     const { isTooLong, text } = this.props.truncateText(this.props.text)
        //     this.setState({
        //         isTruncated: isTooLong,
        //         needsTruncation: isTooLong,
        //         truncatedText: text,
        //     })
        // }
    }

    // private toggleTextTruncation: React.MouseEventHandler = (e) => {
    //     e.stopPropagation()
    //     this.setState((prevState) => ({ isTruncated: !prevState.isTruncated }))
    // }

    render() {
        const text = this.props.text

        return (
            <TruncatedContainer>
                <TruncatedBox isHighlight={this.props.isHighlight}>
                    {this.props.isHighlight && <Highlightbar />}
                    <Markdown pageUrl={this.props.pageUrl}>{text}</Markdown>
                </TruncatedBox>
            </TruncatedContainer>
        )
    }
}

const TruncatedContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`

const TruncatedContent = styled(Markdown)`
    display: flex;
    flex-direction: column;
    color: ${(props) => props.theme.colors.white};
    font-size: 14px;
    font-weight: 300;
    letter-spacing: 1px;
    flex: 1;
    width: 100px;
`

const TextContent = styled.div<{ isHighlight: boolean }>`
    display: inline;
    /* ${(props) =>
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
        `}; */
`

const Highlightbar = styled.div`
    background-color: ${(props) => props.theme.colors.highlightColorDefault};
    margin-right: 10px;
    border-radius: 2px;
    width: 4px;
`

const TruncatedBox = styled.div<{ isHighlight: boolean }>`
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: flex-start;

    ${(props) =>
        props.isHighlight &&
        css`
            flex-direction: row;
        `};
`

const ToggleMoreButtonStyled = styled.div<{ isHighlight: boolean }>`
    margin: 2px 0 0 0px;
    cursor: pointer;
    padding: 0px 5px;
    border-radius: 3px;
    font-size: 12px;
    color: grey;
    line-height: 18px;
    color: ${(props) => props.theme.colors.greyScale5};
    display: flex;
    grid-gap: 5px;
    align-items: center;
    background-color: ${(props) => props.theme.colors.greyScale1};
    height: 24px;

    &:hover {
        background-color: ${(props) => props.theme.colors.greyScale3};
    }

    & * {
        cursor: pointer;
    }

    ${(props) => props.isHighlight && css``};
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
