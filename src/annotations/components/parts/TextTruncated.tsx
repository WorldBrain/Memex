import * as React from 'react'
import ReactMarkdown from 'react-markdown'
import styled from 'styled-components'

import * as icons from 'src/common-ui/components/design-library/icons'
import { TextTruncator } from 'src/annotations/types'
import { truncateText } from 'src/annotations/utils'

export interface Props {
    text: string
    isHighlight: boolean
    truncateText?: TextTruncator
}

interface State {
    shouldTruncate: boolean
}

class TextTruncated extends React.Component<Props, State> {
    static defaultProps: Partial<Props> = { text: '', truncateText }

    state: State = { shouldTruncate: true }

    componentDidMount() {
        const { isTooLong } = this.props.truncateText(this.props.text)
        this.setState({ shouldTruncate: isTooLong })
    }

    componentDidUpdate(prevProps: Props) {
        if (this.props.text !== prevProps.text) {
            const { isTooLong } = this.props.truncateText(this.props.text)
            this.setState({ shouldTruncate: isTooLong })
        }
    }

    private _toggleTextTruncation: React.MouseEventHandler = (e) => {
        e.stopPropagation()
        this.setState((prevState) => ({
            shouldTruncate: !prevState.shouldTruncate,
        }))
    }

    render() {
        const { isTooLong, text: truncatedText } = this.props.truncateText(
            this.props.text,
        )
        const textToBeDisplayed = this.state.shouldTruncate
            ? truncatedText
            : this.props.text

        return (
            <>
                {this.props.isHighlight ? (
                    <HighlightText>{textToBeDisplayed}</HighlightText>
                ) : (
                    <TextBox>
                        <CommentText>{textToBeDisplayed}</CommentText>
                        <IconStyled />
                    </TextBox>
                )}
                <ToggleMoreBox>
                    {isTooLong && (
                        <ToggleMoreButtonStyled
                            onClick={this._toggleTextTruncation}
                        >
                            {this.state.shouldTruncate
                                ? 'Show More'
                                : 'Show Less'}
                        </ToggleMoreButtonStyled>
                    )}
                </ToggleMoreBox>
            </>
        )
    }
}

const IconStyled = styled.button`
    border: none;
    z-index: 2500;
    outline: none;
    border-radius: 3px;
    width: 20px;
    height: 20px;
    opacity: 0.6;
    position: absolute;
    right: 5px;
    top: 5px;
    padding: 3px;
    display: none;
    background-color: #3a2f45;
    mask-image: url(${icons.commentEditFull});
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 16px;
`

const TextBox = styled.div`
    position: relative;
    min-height: 30px;
    display: flex;
    align-items: center;

    &: hover {
        background-color: #e0e0e0;
        border-radius: 3px;
        cursor: pointer;

        &:hover ${IconStyled} {
            display: flex;
        }
    }
`

const CommentText = styled(ReactMarkdown)`
    display: block;
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
`

export default TextTruncated
