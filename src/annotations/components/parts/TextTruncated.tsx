import * as React from 'react'
import styled from 'styled-components'

import { TextTruncator } from 'src/annotations/types'
import { truncateText } from 'src/annotations/utils'

export interface Props {
    text: string
    truncateText?: TextTruncator
    children: (props: { text: string }) => JSX.Element
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

        return (
            <>
                {this.props.children({ text })}
                <ToggleMoreBox>
                    {this.state.needsTruncation && (
                        <ToggleMoreButtonStyled
                            onClick={this.toggleTextTruncation}
                        >
                            {this.state.isTruncated ? 'Show More' : 'Show Less'}
                        </ToggleMoreButtonStyled>
                    )}
                </ToggleMoreBox>
            </>
        )
    }
}

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
