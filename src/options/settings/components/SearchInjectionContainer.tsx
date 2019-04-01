import React from 'react'

import analytics from 'src/analytics'
import SearchInjection from './SearchInjection'
import { Checkbox } from '../../../common-ui/components'

import { getLocalStorage, setLocalStorage } from 'src/search-injection/utils'
import {
    SEARCH_INJECTION_KEY,
    SEARCH_INJECTION_DEFAULT,
} from 'src/search-injection/constants'

class SearchInjectionContainer extends React.Component {
    state = {
        injectionPreference: { ...SEARCH_INJECTION_DEFAULT },
    }

    async componentDidMount() {
        const injectionPreference = await getLocalStorage(
            SEARCH_INJECTION_KEY,
            SEARCH_INJECTION_DEFAULT,
        )
        this.setState({
            injectionPreference,
        })
    }

    bindToggleInjection = name => async () => {
        const { injectionPreference } = this.state
        // Toggle that particular search engine key
        injectionPreference[name] = !injectionPreference[name]
        await setLocalStorage(SEARCH_INJECTION_KEY, injectionPreference)

        if (!injectionPreference[name]) {
            analytics.trackEvent({
                category: 'Search integration',
                action: 'Disabled',
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
