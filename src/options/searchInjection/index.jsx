import React, { Component } from 'react'

import { remoteFunction } from 'src/util/webextensionRPC'
import { Wrapper } from 'src/common-ui/components'

const fetchSearchInjection = remoteFunction('fetchSearchInjection')
const toggleSearchInjection = remoteFunction('toggleSearchInjection')

class SearchInjectionContainer extends Component {
    static propTypes = {}

    constructor(props) {
        super(props)
        this.state = {
            searchInjection: true,
        }
        this.handleToggle = this.handleToggle.bind(this)
    }

    async componentWillMount() {
        const searchInjection = await fetchSearchInjection()
        this.setState({
            searchInjection,
        })
    }

    async handleToggle(event) {
        await toggleSearchInjection()
        const searchInjection = await fetchSearchInjection()
        this.setState({
            searchInjection,
        })
    }

    render() {
        return (
            <Wrapper>
                <label className="switch">
                    <input
                        type="checkbox"
                        onChange={this.handleToggle}
                        checked={this.state.searchInjection}
                    />
                    Toggle Search Injection
                    <hr />
                    <div>
                        This is a new feature of Memex that lets you search the
                        Memex memory and shows results side by side google(for
                        now) results.
                    </div>
                </label>
            </Wrapper>
        )
    }
}

export default SearchInjectionContainer
