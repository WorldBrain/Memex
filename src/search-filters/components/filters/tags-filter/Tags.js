import React, { PureComponent } from 'react'

// import ReactDOM from 'react-dom'

import styles from '../../stylesheets/tags-filter-styles/Tags.module.css'
// import DatesPopup from './DatesPopup';
// import DateRangeSelection from './DateRangeSelection';
import TagsPopup from './TagsPopup'

class Tags extends PureComponent {
    state = {
        showPopup: false,
    }

    openTypesPopup = () => {
        this.setState(prevState => ({
            showPopup: !prevState.showPopup,
        }))
    }

    render() {
        let show = null

        if (this.state.showPopup) {
            show = <TagsPopup />
        }

        return (
            <div className={styles.tagsStyle}>
                <button onClick={this.openTypesPopup}>Tags</button>
                {show}
            </div>
        )
    }
}

export default Tags
