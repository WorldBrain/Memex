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
                            <u
                                onClick={this.props.goToImportRoute}
                            >Import</u> your bookmarks 
                            or {' '}
                            <u
                                onClick={()=>window.open('https://worldbrain.io/tutorials')}
                            >learn</u> how to use Memex
                        </span>
                    </Description>
                </Container>
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
    align-items: center;
    margin-top: -10px;
`

const Description = styled.div`
    font-size: 16px;
    font-weight: normal;
    width: 75%;
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
