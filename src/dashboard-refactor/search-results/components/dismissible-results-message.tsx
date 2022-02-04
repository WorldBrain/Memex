import React from 'react'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import styled from 'styled-components'

export interface Props {
    onDismiss?: React.MouseEventHandler
}

interface State {
    isShown: boolean
}

export default class DismissibleResultsMessage extends React.PureComponent<
    Props,
    State
> {
    state: State = { isShown: true }

    private handleDismiss: React.MouseEventHandler = (e) => {
        this.props.onDismiss?.(e)
        this.setState({ isShown: false })
    }

    render() {
        if (!this.state.isShown) {
            return null
        }

        return (
            <Container>
                <DismissButton>
                    <Icon
                        filePath={icons.close}
                        heightAndWidth="16px"
                        onClick={this.handleDismiss}
                    />
                </DismissButton>
                {this.props.children}
            </Container>
        )
    }
}

const Container = styled.div`
    background: #ffffff;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    padding: 50px;

    // composes: fadeIn from 'src/common-ui/elements.css';
    animation: fadeIn 500ms ease;

    align-items: center;
    display: flex;
    flex-direction: column;
    position: relative;
    margin: 20px 0 40px 0;
    width: fill-available;
`

const DismissButton = styled.div`
    border: none;
    outline: none;
    position: absolute;
    top: 1rem;
    right: 1rem;
`
