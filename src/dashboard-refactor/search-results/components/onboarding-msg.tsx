import React from 'react'
import styled from 'styled-components'
import Button from '@worldbrain/memex-common/lib/common-ui/components/button'

interface Props {
    goToImportRoute: () => void
}

export default class OnboardingMsg extends React.PureComponent<Props> {
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
                <Button
                    type="primary-action"
                    onClick={this.props.goToImportRoute}
                >
                    Get Started
                </Button>
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
