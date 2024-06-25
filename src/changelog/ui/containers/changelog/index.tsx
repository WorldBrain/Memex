import React from 'react'
import styled from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import ChangelogLogic from './logic'
import { ChangelogState, ChangelogDependencies, ChangelogEvent } from './types'
import { runInBackground } from 'src/util/webextensionRPC'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
export interface Props extends Omit<ChangelogDependencies, 'authBG'> {}

export default class Changelog extends StatefulUIElement<
    Props,
    ChangelogState,
    ChangelogEvent
> {
    constructor(props: Props) {
        super(
            props,
            new ChangelogLogic({
                ...props,
                authBG: runInBackground(),
            }),
        )
        this.state = {
            ...this.state,
            iframeLoading: 'pristine', // Add loading state
        }
    }

    handleIframeLoad = () => {
        this.setState({ iframeLoading: 'success' })
    }

    render() {
        return (
            <Container>
                {this.state.iframeLoading !== 'success' &&
                    this.state.urlToUseForIframe != null && (
                        <LoadingContainer>
                            <LoadingIndicator size={40} />
                        </LoadingContainer>
                    )}

                <IframeContainer>
                    <Iframe
                        src={this.state.urlToUseForIframe}
                        onLoad={this.handleIframeLoad}
                    />
                </IframeContainer>
            </Container>
        )
    }
}

const Container = styled.div`
    height: 100%;
    width: 100%;
    position: relative;
`

const Iframe = styled.iframe`
    height: 100%;
    width: 100%;
    border: none;
`

const LoadingContainer = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 0;
    left: 0;
    background: ${(props) => props.theme.colors.black};
`

const IframeContainer = styled.div`
    height: 100%;
    width: 100%;
`
