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
            <HighlightStyled>
                <NewAnnotationStyled>New Annotation</NewAnnotationStyled>
                <HighlightedTextStyled>
                    {this._getHighlightText()}
                    {this._isHighlightLong() && (
                        <ShowMoreButtonStyled
                            onClick={this._toggleHighlightTruncation}
                        />
                    )}
                </HighlightedTextStyled>
            </HighlightStyled>
        )
    }
}

const NewAnnotationStyled = styled.div``
const HighlightStyled = styled.span``
const HighlightedTextStyled = styled.span``

const ShowMoreButtonStyled = styled.button`
    margin: 5px 0 0 5px;
    cursor: pointer;
    display: inline-block;
    background-image: url('/img/longarrow.svg');
    background-color: transparent;
    background-repeat: no-repeat;
    background-size: 43px;
    width: 40px;
    height: 20px;
    background-position: center;
    transition: transform 0.15s ease-in;
    transform: rotate(0deg);
    border: none;
    outline: none;

    &.rotated {
        transform: rotate(-180deg);
        transform-origin: center;
    }
`

export default TextHighlighted
