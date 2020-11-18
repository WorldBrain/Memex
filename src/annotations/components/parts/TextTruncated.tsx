import * as React from 'react'
import styled from 'styled-components'
import Markdown from '@worldbrain/memex-common/lib/common-ui/components/markdown'

import * as icons from 'src/common-ui/components/design-library/icons'
import { TextTruncator } from 'src/annotations/types'
import { truncateText } from 'src/annotations/utils'

export interface Props {
    text: string
    isHighlight: boolean
    skipTruncation: boolean
    truncateText?: TextTruncator
    onCommentEditClick?: React.MouseEventHandler
}

interface State {
    isTruncated: boolean
    truncatedText: string
    needsTruncation: boolean
}

// TODO: This comp needs rethinking - doing too many things.
//   A more general truncating comp would be nice that doesn't assume what it should render apart from text length
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

    private _toggleTextTruncation: React.MouseEventHandler = (e) => {
        e.stopPropagation()
        this.setState((prevState) => ({ isTruncated: !prevState.isTruncated }))
    }

    render() {
        const textToBeDisplayed =
            !this.props.skipTruncation && this.state.isTruncated
                ? this.state.truncatedText
                : this.props.text

        return (
            <>
                {this.props.isHighlight ? (
                    <HighlightText>{textToBeDisplayed}</HighlightText>
                ) : (
                    <TextBox>
                        <CommentText>{textToBeDisplayed}</CommentText>
                        <IconStyledBox onClick={this.props.onCommentEditClick}>
                            <IconStyled />
                        </IconStyledBox>
                    </TextBox>
                )}
                <ToggleMoreBox>
                    {!this.props.skipTruncation &&
                        this.state.needsTruncation && (
                            <ToggleMoreButtonStyled
                                onClick={this._toggleTextTruncation}
                            >
                                {this.state.isTruncated
                                    ? 'Show More'
                                    : 'Show Less'}
                            </ToggleMoreButtonStyled>
                        )}
                </ToggleMoreBox>
            </>
        )
    }
}

const IconStyledBox = styled.div`
    background-color: #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: absolute;
    right: 5px;
    top: 0px;
    border-radius: 3px;
    padding: 3px;
    display: none;
`

const IconStyled = styled.button`
    border: none;
    z-index: 2500;
    outline: none;
    width: 20px;
    height: 20px;
    opacity: 0.6;
    background-color: #3a2f45;
    mask-image: url(${icons.commentEditFull});
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 16px;
    cursor: pointer;
`

const TextBox = styled.div`
    position: relative;
    min-height: 30px;
    display: flex;
    align-items: center;
    overflow-x: hidden;
    line-height: 22px;
    line-break: anywhere;

    & *:first-child {
        margin-top: 0px;
    }

    & *:last-child {
        margin-bottom: 0px;
    }

    &: hover ${IconStyledBox} {
        display: flex;
    }
`

const CommentText = styled(Markdown)`
    display: block;
    width: 100%;
`

const HighlightText = styled.span`
    box-decoration-break: clone;
    overflow: hidden;
    line-height: 25px;
    font-style: normal;
    background-color: #65ffc8;
    color: #3a2f45;
    padding: 2px 5px;
`

const ToggleMoreButtonStyled = styled.div`
    margin: 2px 0 0 -3px;
    cursor: pointer;
    padding: 2px 8px;
    border-radius: 3px;
    font-size 12px;
    color: grey;
    line-height: 18px;

    &: hover {
        background-color: #e0e0e0;
        color: #3a2f45;
    }
`

const ToggleMoreBox = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    cursor: pointer;
`

export default TextTruncated
