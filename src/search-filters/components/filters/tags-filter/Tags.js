import React, { PureComponent } from 'react'

// import ReactDOM from 'react-dom'

import styles from '../../stylesheets/tags-filter-styles/Tags.module.css'
// import DatesPopup from './DatesPopup';
// import DateRangeSelection from './DateRangeSelection';
import TagsPopup from './TagsPopup'

class Tags extends PureComponent {
    state = {
        showPopup: false,
        count: 0,
        tags: [],
    }

    count = count => {
        this.setState({ count: count })
    }

    tags = tags => {
        this.setState({ tags: tags })
    }

    toggleTypesPopup = () => {
        this.setState(prevState => ({
            showPopup: !prevState.showPopup,
        }))
    }

    render() {
        let show = null

        if (this.state.showPopup) {
            show = <TagsPopup checkCount={this.count} checkTags={this.tags} />
        }
        // console.log(this.state.tags)

        return (
            <div className={styles.tagsStyle}>
                <button
                    className={
                        this.state.count > 0
                            ? styles.tagButtonSelected
                            : styles.tagButton
                    }
                    onClick={this.toggleTypesPopup}
                >
                    Tags{' '}
                    {this.state.count === 0 ? null : (
                        <span
                            style={{
                                fontWeight: 'bold',
                                paddingLeft: '4px',
                            }}
                        >
                            {this.state.count}
                        </span>
                    )}
                </button>
                <div style={{ display: 'grid' }}>
                    <span style={{ fontSize: '15px' }}>
                        {this.state.tags.map(type => {
                            if (type) {
                                return <span>{type}, </span>
                            }
                        })}
                    </span>
                </div>
                {show}
            </div>
        )
    }
}

export default Tags
