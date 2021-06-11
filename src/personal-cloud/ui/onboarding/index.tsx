import React from 'react'
import styled from 'styled-components'
import { UIElement } from '@worldbrain/memex-common/lib/main-ui/classes'

import CloudOnboardingModalLogic from './logic'
import Overlay from '@worldbrain/memex-common/lib/main-ui/containers/overlay'
import type { Dependencies, State, Event } from './types'

export interface Props extends Dependencies {}

export default class CloudOnboardingModal extends UIElement<
    Props,
    State,
    Event
> {
    constructor(props: Props) {
        super(props, { logic: new CloudOnboardingModalLogic(props) })
    }

    render() {
        return (
            <Overlay
                services={this.props.services}
                onCloseRequested={() => console.log('CLSOEE!!!!')}
            >
                <></>
            </Overlay>
        )
    }
}
