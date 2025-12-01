import React, { PureComponent } from 'react'
import styled from 'styled-components'

export interface Props {}

class OnboardingBox extends PureComponent<Props> {
    render() {
        return (
            <div>
                <FlexLayout>
                    <div className="container">{this.props.children}</div>
                    <div className="black" />
                </FlexLayout>
            </div>
        )
    }
}

const FlexLayout = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center; /* We need the white box to sit in the middle of the screen */
    height: 100vh;
    align-items: center;
    overflow: hidden;
    background-color: ${(props) => props.theme.colors.black0};
    width: 100vw;
    position: absolute;

    * {
        font-family: 'Satoshi', sans-serif;
        font-feature-settings:
            'pnum' on,
            'lnum' on,
            'case' on,
            'ss03' on,
            'ss04' on,
            'liga' off;
        letter-spacing: 0.8px;
    }
`

export default OnboardingBox
