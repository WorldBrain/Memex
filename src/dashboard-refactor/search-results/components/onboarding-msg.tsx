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
                            Want to{' '}
                            <u onClick={this.props.goToImportRoute}>import</u>{' '}
                            your bookmarks?
                        </span>
                        <BookmarkingProviders
                            onClick={this.props.goToImportRoute}
                            src={'img/bookmarking-providers.svg'}
                        />
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

const BookmarkingProviders = styled.img`
    height: 150px;
    display: flex;
    position: relative;
    margin-top: 10px;
    cursor: pointer;
`

const Description = styled.div`
    font-size: 16px;
    font-weight: normal;
    margin-top: 30px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;

    & u {
        cursor: pointer;
    }
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
