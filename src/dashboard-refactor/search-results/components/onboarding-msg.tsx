import React from 'react'
import styled from 'styled-components'

interface Props {}

export default class OnboardingMsg extends React.PureComponent<Props> {
    private handleCTAClick: React.MouseEventHandler = (e) => {
        window.location.hash = '#/import'
    }

    render() {
        return (
            <>
                <Container>
                    <Description>
                        <span>
                            <strong>
                                Import your bookmarks to make them full-text
                                searchable
                            </strong>{' '}
                            <br /> From Pocket, Diigo, Raindrop.io and many
                            more.
                        </span>
                    </Description>
                </Container>
                <CTABtn onClick={this.handleCTAClick}>Get Started</CTABtn>
            </>
        )
    }
}

const Container = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    width: 100%;
`

const Description = styled.div`
    font-size: 16px;
    font-weight: normal;
    width: 75%;
    margin: 1rem auto;
    text-align: center;
`

const CTABtn = styled.button`
    display: inline-flex;
    // composes: CTA from 'src/common-ui/elements.css';
    background: color2;
    color: white;
    font-size: 14px;

    &:hover {
        background: #44bc8b;
        color: white;
    }
`
