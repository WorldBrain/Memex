import React from 'react'

import analytics from 'src/analytics'
import SearchInjection from './SearchInjection'
import { Checkbox } from '../../../common-ui/components'

import { SEARCH_INJECTION_DEFAULT } from 'src/search-injection/constants'
import { UISyncSettings, createUISyncSettings } from 'src/settings/ui/util'
import { runInBackground } from 'src/util/webextensionRPC'

class SearchInjectionContainer extends React.Component {
    syncSettings: Pick<UISyncSettings, 'searchInjection'>

    state = {
        injectionPreference: { ...SEARCH_INJECTION_DEFAULT },
    }

    constructor(props) {
        super(props)

        this.syncSettings = createUISyncSettings({
            syncSettingsBG: runInBackground(),
        })
    }

    async componentDidMount() {
        const injectionPreference = await this.syncSettings.searchInjection.get(
            'searchEnginesEnabled',
        )
        if (injectionPreference) {
            this.setState({ injectionPreference })
        }
    }

    private bindToggleInjection = (name) => async () => {
        const { injectionPreference } = this.state
        // Toggle that particular search engine key
        injectionPreference[name] = !injectionPreference[name]
        await this.syncSettings.searchInjection.set(
            'searchEnginesEnabled',
            injectionPreference,
        )

        if (!injectionPreference[name]) {
            analytics.trackEvent({
                category: 'SearchEngineIntegration',
                action: 'disableSearchIntegration',
                name,
            })
        }

        this.setState({
            injectionPreference,
        })
    }

    render() {
        return (
            <SearchInjection>
                <Checkbox
                    isChecked={this.state.injectionPreference.google}
                    handleChange={this.bindToggleInjection('google')}
                    id="si-google"
                >
                    Google
                </Checkbox>
                <Checkbox
                    isChecked={this.state.injectionPreference.duckduckgo}
                    handleChange={this.bindToggleInjection('duckduckgo')}
                    id="si-ddg"
                >
                    DuckDuckGo
                </Checkbox>
            </SearchInjection>
        )
    }
}

export default SearchInjectionContainer
