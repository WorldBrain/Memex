import * as React from 'react'
import cx from 'classnames'
import styled from 'styled-components'

const styles = require('./truncated-text-renderer.css')

interface Props {
    text: string
    getTruncatedTextObject: (
        text: string,
    ) => {
        isTextTooLong: boolean
        text: string
    }
    isHighlight: boolean
}

interface State {
    shouldTruncate: boolean
}

class TruncatedTextRenderer extends React.Component<Props, State> {
    state = {
        shouldTruncate: true,
    }

    componentDidMount() {
        const { text, getTruncatedTextObject } = this.props
        const { isTextTooLong } = getTruncatedTextObject(text)
        this.setState({ shouldTruncate: isTextTooLong })
    }

    componentDidUpdate(prevProps: Props) {
        const { text, getTruncatedTextObject } = this.props
        if (text !== prevProps.text) {
            const { isTextTooLong } = getTruncatedTextObject(text)
            this.setState({ shouldTruncate: isTextTooLong })
        }
    }

    private _toggleTextTruncation = (e: React.MouseEvent) => {
        e.stopPropagation()
        this.setState(prevState => ({
            shouldTruncate: !prevState.shouldTruncate,
        }))
    }

    render() {
        const { text, getTruncatedTextObject } = this.props
        const { isTextTooLong, text: truncatedText } = getTruncatedTextObject(
            text,
        )
        const { shouldTruncate } = this.state
        const textToBeDisplayed = shouldTruncate ? truncatedText : text

        return (
            <React.Fragment>
                {this.props.isHighlight ? (
                        <>
                            <Highlight><HighlightText><TextToBeDisplayed>{textToBeDisplayed}</TextToBeDisplayed></HighlightText>
                            <CommentTextBox>
                            {isTextTooLong && (
                                <ToggleMoreButtonStyled
                                        onClick={this._toggleTextTruncation}
                                    >
                                        {shouldTruncate ? 'Show More' : 'Show Less'}
                                </ToggleMoreButtonStyled>
                            )}
                            </CommentTextBox>
                            </Highlight>
                        </>
                    ):(
                        <>
                            <TextToBeDisplayed>{textToBeDisplayed}</TextToBeDisplayed>
                                <CommentTextBox>
                                {isTextTooLong && (
                                    <ToggleMoreButtonStyled
                                            onClick={this._toggleTextTruncation}
                                        >
                                            {shouldTruncate ? 'Show More' : 'Show Less'}
                                    </ToggleMoreButtonStyled>
                                )}
                            </CommentTextBox>
                        </>
                )}
                
            </React.Fragment>
        )
    }
}

const TextToBeDisplayed = styled.span`
    box-decoration-break: clone;
    padding: 0 5px;
`

const ToggleMoreButtonStyled = styled.div`
    margin: 2px 0 0 0;
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

const CommentTextBox = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
`

const Highlight = styled.div`
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.5px;
    margin: 0 0 5px 0;
    padding: 15px 15px 7px 15px;
    line-height: 20px;
    text-align: left;
`

const HighlightText = styled.span`
    background-color: #65ffc8;
    line-height: 28px;
    font-style: normal;
    color: #3a2f45;
    padding: 2px 0px;
    box-decoration-break: clone;
    white-space: normal;
`

export default TruncatedTextRenderer
