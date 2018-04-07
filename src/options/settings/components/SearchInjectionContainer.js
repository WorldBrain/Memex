import React from 'react'

import analytics from 'src/analytics'
import SearchInjection from './SearchInjection'
import {
    getLocalStorage,
    setLocalStorage,
    SEARCH_INJECTION_DEFAULT,
} from 'src/search-injection/utils'
import { SEARCH_INJECTION_KEY } from 'src/search-injection/constants'

class SearchInjectionContainer extends React.Component {
    constructor(props) {
        super(props)
        this.toggleInjection = this.toggleInjection.bind(this)
    }

    state = {
        injectionPreference: {
            google: true,
            duckduckgo: true,
        },
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

    async toggleInjection(name) {
        const { injectionPreference } = this.state
        // Toggle that field
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
            <SearchInjection
                injectionPreference={this.state.injectionPreference}
                toggleInjection={this.toggleInjection}
            />
        )
    }
}

export default SearchInjectionContainer
