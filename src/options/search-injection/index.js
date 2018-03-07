import React from 'react'

import { Wrapper } from 'src/common-ui/components'
import { getLocalStorage, setLocalStorage } from 'src/search-injection/utils'
import { SEARCH_INJECTION_KEY } from 'src/search-injection/constants'

class SearchInjection extends React.Component {
    constructor(props) {
        super(props)
        this.toggle = this.toggle.bind(this)
    }

    state = {
        searchInjection: true,
    }

    async componentDidMount() {
        const searchInjection = await getLocalStorage(SEARCH_INJECTION_KEY)
        this.setState({
            searchInjection,
        })
    }

    async toggle() {
        const toggled = !this.state.searchInjection
        await setLocalStorage(SEARCH_INJECTION_KEY, toggled)
        this.setState({
            searchInjection: toggled,
        })
    }

    render() {
        const { searchInjection } = this.state
        return (
            <Wrapper>
                <div>
                    <label>
                        <input
                            type="checkbox"
                            checked={searchInjection}
                            onChange={this.toggle}
                        />
                        {'   '} Do you want your Memex memory results to be show
                        along with other search engine results like Google?
                    </label>
                </div>
            </Wrapper>
        )
    }
}

export default SearchInjection
