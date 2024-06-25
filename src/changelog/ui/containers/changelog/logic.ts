import { UILogic, UIEventHandler } from 'ui-logic-core'
import { ChangelogState, ChangelogDependencies, ChangelogEvent } from './types'

export const INITIAL_STATE: ChangelogState = {
    urlToUseForIframe: null,
}

type EventHandler<EventName extends keyof ChangelogEvent> = UIEventHandler<
    ChangelogState,
    ChangelogEvent,
    EventName
>

export default class ChangelogLogic extends UILogic<
    ChangelogState,
    ChangelogEvent
> {
    constructor(protected dependencies: ChangelogDependencies) {
        super()
    }

    getInitialState(): ChangelogState {
        return {
            ...INITIAL_STATE,
        }
    }

    init = async () => {
        const JWTTokenForFeatureBase = await this.dependencies.authBG.getJWTTokenForFeatureBase()

        let urlToUseForIframe = `https://feedback.memex.garden/changelog?jwt=${JWTTokenForFeatureBase}`

        if (this.dependencies.mode === 'feedback') {
            urlToUseForIframe = `https://feedback.memex.garden/?jwt=${JWTTokenForFeatureBase}`
        }

        this.emitMutation({
            urlToUseForIframe: { $set: urlToUseForIframe },
        })
    }
    cleanup = () => {}
}
