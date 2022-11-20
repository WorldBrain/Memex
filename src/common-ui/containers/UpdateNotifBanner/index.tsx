import React from 'react'

import { Logic, LogicDeps, State, Event } from './logic'
import { CHANGE_LOG_LINK } from './constants'
import { StatefulUIElement } from 'src/util/ui-logic'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { NotifBanner, ThemeProps } from 'src/common-ui/components/NotifBanner'
import { MemexTheme } from '@worldbrain/memex-common/lib/common-ui/styles/types'

export interface Props extends Partial<LogicDeps> {
    theme?: ThemeProps
    openLink?: (link: string) => void
    location?: string
}

export class UpdateNotifBanner extends StatefulUIElement<Props, State, Event> {
    static defaultProps: Partial<Props> = {
        openLink: (link) => window.open(link, '_blank'),
    }

    constructor(props: Props) {
        super(
            props,
            new Logic({
                getStorage: getLocalStorage,
                setStorage: setLocalStorage,
                ...props,
            }),
        )
    }

    render() {
        if (!this.state.isVisible) {
            return null
        }

        console.log(this.props.location && this.props.location)

        return (
            <NotifBanner
                mainText="Memex updated"
                mainBtnText="See what changed"
                onCloseBtnClick={() => this.processEvent('hide', null)}
                onMainBtnClick={() => {
                    this.processEvent('hide', null)
                    this.props.openLink(CHANGE_LOG_LINK)
                }}
                location={this.props.location}
                {...this.props}
            />
        )
    }
}
