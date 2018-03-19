import React, { Component } from 'react'
import { INJECTION_POSITION_KEY } from 'src/search-injector/constants'
import {
    toggleSearchInjection,
    storeValue,
    fetchSearchInjection,
    fetchData,
} from 'src/search-injector/utilities'

class SearchInjectionContainer extends Component {
    static propTypes = {}

    constructor(props) {
        super(props)
        this.state = {
            searchInjection: true,
            data: '',
        }
        this.handleToggle = this.handleToggle.bind(this)
        this.handleInjectionPositionChange = this.handleInjectionPositionChange.bind(
            this,
        )
    }

    async componentWillMount() {
        const searchInjection = await fetchSearchInjection()
        const data = await fetchData(INJECTION_POSITION_KEY)

        this.setState({
            searchInjection,
            data,
        })
    }

    async handleToggle(event) {
        await toggleSearchInjection()
        const searchInjection = await fetchSearchInjection()
        this.setState({
            searchInjection,
        })
    }

    async handleInjectionPositionChange(event) {
        const { value } = event.target
        await storeValue(INJECTION_POSITION_KEY, value)
        const data = await fetchData(INJECTION_POSITION_KEY)
        this.setState({
            data,
        })
    }

    render() {
        return (
            <div>
                <label className="switch">
                    <input
                        type="checkbox"
                        onChange={this.handleToggle}
                        checked={this.state.searchInjection}
                    />
                    Toggle Search Injection
                    <hr />
                    {/* <select onChange={this.handleInjectionPositionChange}>
                        <option value={ALONGSIDE_SEARCH_RESULT}>{ALONGSIDE_SEARCH_RESULT}</option>
                        <option value={OVER_SEARCH_RESULT}>{OVER_SEARCH_RESULT}</option>
                    </select> */}
                    <hr />
                    <div>
                        This is a new feature of Memex that lets you search the
                        Memex memory and shows results side by side google(for
                        now) results.
                    </div>
                </label>
            </div>
        )
    }
}

export default SearchInjectionContainer
