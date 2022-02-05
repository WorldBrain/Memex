import * as React from 'react'
import styled from 'styled-components'

import { TextTruncator } from 'src/annotations/types'
import { truncateText } from 'src/annotations/utils'
import * as icons from 'src/common-ui/components/design-library/icons'

import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import memexStorex from 'src/search/memex-storex'

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
            <TruncatedBox>
                {this.props.children({ text })}
                <ToggleMoreBox>
                    {this.state.needsTruncation && (
                        <ToggleMoreButtonStyled
                            onClick={this.toggleTextTruncation}
                        >
                            <Icon
                                filePath={
                                    this.state.isTruncated
                                        ? icons.expand
                                        : icons.compress
                                }
                                heightAndWidth={'10px'}
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

const TruncatedBox = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
`

const ToggleMoreButtonStyled = styled.div`
    margin: 2px 0 0 0px;
    cursor: pointer;
    padding: 2px 5px;
    border-radius: 3px;
    font-size 12px;
    color: grey;
    line-height: 18px;
    color: ${(props) => props.theme.colors.lighterText};
    display: flex;
    grid-gap: 5px;
    align-items: center;

    &: hover {
        background-color: ${(props) =>
            props.theme.colors.backgroundColorDarker};
    }

    & * {
        cursor: pointer;
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
