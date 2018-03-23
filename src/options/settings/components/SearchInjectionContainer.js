import React from 'react'

import analytics from 'src/analytics'
import SearchInjection from './SearchInjection'
import { getLocalStorage, setLocalStorage } from 'src/search-injection/utils'
import { SEARCH_INJECTION_KEY } from 'src/search-injection/constants'

class SearchInjectionContainer extends React.Component {
    constructor(props) {
        super(props)
        this.toggleInjection = this.toggleInjection.bind(this)
    }

    state = {
        isInjectionEnabled: false,
    }

    async componentDidMount() {
        const isInjectionEnabled = await getLocalStorage(SEARCH_INJECTION_KEY, true)
        this.setState({
            isInjectionEnabled,
        })
    }

    async toggleInjection() {
        const toggled = !this.state.isInjectionEnabled
        await setLocalStorage(SEARCH_INJECTION_KEY, toggled)

        if (!toggled) {
            analytics.trackEvent({
                category: 'Search integration',
                action: 'Disabled',
                name: 'Options script',
            })
        }

        this.setState({
            isInjectionEnabled: toggled,
        })
    }

    render() {
        return (
            <SearchInjection
                isInjectionEnabled={this.state.isInjectionEnabled}
                toggleInjection={this.toggleInjection}
            />
        )
    }
}

export default SearchInjectionContainer
