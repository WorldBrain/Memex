import React from 'react'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { logoNoText } from 'src/common-ui/components/design-library/icons'

export interface Props {
    onGoToClick: React.MouseEventHandler
    mouseLeaveHideTimeoutMs?: number
}

interface State {
    isShown: boolean
    isExpanded: boolean
}

export default class PageActivityIndicator extends React.PureComponent<
    Props,
    State
> {
    static defaultProps: Pick<Props, 'mouseLeaveHideTimeoutMs'> = {
        mouseLeaveHideTimeoutMs: 700,
    }

    state: State = { isShown: true, isExpanded: false }
    private timeoutId?: number

    private handleMouseEnter: React.MouseEventHandler = (e) => {
        clearTimeout(this.timeoutId)
        this.setState({ isExpanded: true })
    }

    private handleMouseLeave: React.MouseEventHandler = (e) => {
        clearTimeout(this.timeoutId)
        this.timeoutId = setTimeout(() => {
            this.setState({ isExpanded: false })
        }, this.props.mouseLeaveHideTimeoutMs)
    }

    render() {
        if (!this.state.isShown) {
            return null
        }

        return (
            <Container
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
            >
                {this.state.isExpanded ? (
                    <ExpandedContainer>
                        <Icon
                            icon="close"
                            heightAndWidth="20px"
                            onClick={() => this.setState({ isShown: false })}
                        />
                        <TextBox>
                            <TextMain>Page is annotated</TextMain>
                            <TextSecondary>
                                in Memex Spaces you follow
                            </TextSecondary>
                        </TextBox>
                        <Icon
                            icon="goTo"
                            heightAndWidth="20px"
                            onClick={this.props.onGoToClick}
                        />
                    </ExpandedContainer>
                ) : (
                    <MiniContainer>
                        <Icon filePath={logoNoText} heightAndWidth="30px" />
                    </MiniContainer>
                )}
            </Container>
        )
    }
}

const Container = styled.div`
    position: fixed;
    top: 15px;
    right: 15px;

    border-radius: 30px;
    padding: 10px;
    background-color: #15202b;
`
const MiniContainer = styled.div``
const ExpandedContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
`
const TextBox = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    color: #f3f3f3;
`
const TextMain = styled.span`
    font-size: 18px;
    font-weight: bold;
`
const TextSecondary = styled.span`
    font-size: 16px;
`
const CancelBtn = styled.button``
const OpenBtn = styled.button``
