import React from 'react'
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
                {this.props.children}
                <DismissButton onClick={this.handleDismiss} />
            </Container>
        )
    }
}

const Container = styled.div`
    // composes: boxShadow from 'src/common-ui/colors.css';
    border-radius: radius3;
    box-shadow: rgba(15, 15, 15, 0.1) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 2px 4px;
    transition: background 120ms ease-in 0s;
    &:hover {
        transition: background 120ms ease-in 0s;
        background-color: rgba(55, 53, 47, 0.03);
    }

    // composes: fadeIn from 'src/common-ui/elements.css';
    animation: fadeIn 500ms ease;

    align-items: center;
    background-color: white;
    border-radius: 3px;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 1rem;
    margin: 40px auto 17px;
    max-width: 95%;
    min-width: 700px;
    padding-bottom: 30px;
`

const DismissButton = styled.button`
    // composes: removeIcon from 'src/common-ui/icons.css';
    // composes: standardIcon;
    mask-position: center;
    mask-repeat: no-repeat;
    height: 20px;
    width: 20px;
    mask-size: 16px;
    background-color: #3a2f45;
    mask-position: center;
    mask-repeat: no-repeat;
    mask-image: url('/img/close.svg');

    border: none;
    outline: none;
    position: absolute;
    top: 1rem;
    right: 1rem;

    &:hover {
        cursor: pointer;
    }
`
