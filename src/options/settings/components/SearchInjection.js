import React from 'react'

import { getLocalStorage, setLocalStorage } from 'src/search-injection/utils'
import { SEARCH_INJECTION_KEY } from 'src/search-injection/constants'
import Checkbox from './Checkbox'
import styles from './SearchInjection.css'

class SearchInjection extends React.Component {
    constructor(props) {
        super(props)
        this.toggle = this.toggle.bind(this)
    }

    state = {
        checked: false,
    }

    async componentDidMount() {
        const checked = await getLocalStorage(SEARCH_INJECTION_KEY, true)
        this.setState({
            checked,
        })
    }

    async toggle() {
        const toggled = !this.state.checked
        await setLocalStorage(SEARCH_INJECTION_KEY, toggled)
        this.setState({
            checked: toggled,
        })
    }

    render() {
        const { checked } = this.state
        return (
            <div>
                <p className={styles.settingsHeader}>
                    Show Memex Results in Search Engines
                </p>
                <Checkbox
                    name="google"
                    id="google-checkbox"
                    isChecked={checked}
                    handleChange={this.toggle}
                >
                    Google
                </Checkbox>
            </div>
        )
    }
}

export default SearchInjection
