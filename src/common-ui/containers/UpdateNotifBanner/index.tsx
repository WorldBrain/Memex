import React from 'react'

import { Logic, LogicDeps, State, Event } from './logic'
import { CHANGE_LOG_LINK } from './constants'
import { StatefulUIElement } from 'src/util/ui-logic'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { NotifBanner, ThemeProps } from 'src/common-ui/components/NotifBanner'

export interface Props extends Partial<LogicDeps> {
    theme?: ThemeProps
    openLink?: (link: string) => void
    location?: string
    sidebarContext?: string
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
                getFeatureBaseToken: async () => null,
                ...props,
            }),
        )
    }

    render() {
        if (
            !this.state.isVisible ||
            this.props.sidebarContext === 'dashboard'
        ) {
            return null
        }

        return (
            <NotifBanner
                mainText="Memex updated"
                mainBtnText="See what changed"
                onCloseBtnClick={() => this.processEvent('hide', null)}
                onMainBtnClick={() => {
                    this.processEvent('hide', null)
                    this.props.openLink(
                        CHANGE_LOG_LINK +
                            '/?jwt=' +
                            this.state.featureBaseToken,
                    )
                }}
                location={this.props.location}
                {...this.props}
            />
        )
    }
}
