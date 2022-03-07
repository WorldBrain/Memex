import React from 'react'

import analytics from 'src/analytics'
import SearchInjection from './SearchInjection'
import { Checkbox } from '../../../common-ui/components'
import styled from 'styled-components'

import { SEARCH_INJECTION_DEFAULT } from 'src/search-injection/constants'
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import { runInBackground } from 'src/util/webextensionRPC'

class SearchInjectionContainer extends React.Component {
    syncSettings: SyncSettingsStore<'searchInjection'>

    state = {
        injectionPreference: { ...SEARCH_INJECTION_DEFAULT },
    }

    constructor(props) {
        super(props)

        this.syncSettings = createSyncSettingsStore({
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
                <CheckBoxRow>
                    <Checkbox
                        isChecked={this.state.injectionPreference.google}
                        handleChange={this.bindToggleInjection('google')}
                        id="si-google"
                    >
                        Google
                    </Checkbox>
                </CheckBoxRow>
                <CheckBoxRow>
                    <Checkbox
                        isChecked={this.state.injectionPreference.duckduckgo}
                        handleChange={this.bindToggleInjection('duckduckgo')}
                        id="si-ddg"
                    >
                        DuckDuckGo
                    </Checkbox>
                </CheckBoxRow>
                <CheckBoxRow>
                    <Checkbox
                        isChecked={this.state.injectionPreference.brave}
                        handleChange={this.bindToggleInjection('brave')}
                        id="si-brave"
                    >
                        Brave
                    </Checkbox>
                </CheckBoxRow>
                <CheckBoxRow>
                    <Checkbox
                        isChecked={this.state.injectionPreference.bing}
                        handleChange={this.bindToggleInjection('bing')}
                        id="si-bing"
                    >
                        Bing
                    </Checkbox>
                </CheckBoxRow>
            </SearchInjection>
        )
    }
}

const CheckBoxRow = styled.div`
    height: 50px;
`

export default SearchInjectionContainer
