import * as React from 'react'
import { Anchor } from 'src/highlighting/types'
import styled from 'styled-components'

interface Props {
    anchor: Anchor
    truncateHighlight: boolean
    setTruncateHighlight: (value: boolean) => void
}

class TextHighlighted extends React.Component<Props> {
    /**
     * Method that decides whether a highlight is too long.
     */
    private _isHighlightLong = () => {
        return this.props.anchor.quote.length > 280
    }

    /**
     * Gets the text to be displayed from the highlight.
     * Returns full text if the text is not too long or if
     * `truncateHighlight` param is false, else returns
     * truncated text.
     */
    private _getHighlightText = () => {
        const { anchor } = this.props
        const { truncateHighlight } = this.props

        const highlight = anchor.quote
        if (this._isHighlightLong() && truncateHighlight) {
            const truncatedText = highlight.slice(0, 280) + ' [...]'
            return truncatedText
        }
        return highlight
    }

    private _toggleHighlightTruncation = () => {
        this.props.setTruncateHighlight(!this.props.truncateHighlight)
    }

    render() {
        const { truncateHighlight } = this.props

        return (
            <>
                <HighlightStyled>
                    <HighlightedTextStyled>
                        {this._getHighlightText()}
                    </HighlightedTextStyled>
                </HighlightStyled>
            </>
        )
    }
}

const HighlightStyled = styled.span`
    margin: 10px;
`

const HighlightedTextStyled = styled.span`
    background-color: #d4e8ff;
    padding: 2px 0;
    line-height: 25px;
    font-style: normal;
    color: #3a2f45;
    font-size: 14px;
`

const ShowMoreButtonStyled = styled.button`
    padding: 3px 5px;
    border: none;
    outline: none;
    text: 'Show';
`

export default TextHighlighted
