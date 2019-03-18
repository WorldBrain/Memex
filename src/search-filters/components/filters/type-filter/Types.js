import React, { PureComponent } from 'react'

import styles from '../../stylesheets/type-filter-styles/Types.module.css'
import TypesPopup from './TypesPopup'

class Types extends PureComponent {
    state = {
        types: {
            websites: false,
            annotations: false,
            highlights: false,
            comments: false,
            memex: false,
        },
        showPopup: false,
        unSelect: false,
        count: 0,
    }

    openTypesPopup = () => {
        this.setState(prevState => ({
            showPopup: !prevState.showPopup,
            unSelect: false,
        }))
    }

    unSelect = () => {
        this.setState({
            unSelect: true,
            showPopup: false,
            count: 0,
            types: {
                ...this.state.types,
                websites: false,
                annotations: false,
                highlights: false,
                comments: false,
                memex: false,
            },
        })
    }

    typeStatus = types => {
        this.setState({ types: types })
    }

    count = count => {
        this.setState({ count: count })
    }

    render() {
        // console.log(this.state.types)
        let show = null
        if (this.state.showPopup) {
            show = (
                <TypesPopup
                    prevTypes={this.state.types}
                    typeStatus={this.typeStatus}
                    checkCount={this.count}
                    showPopup={this.state.showPopup}
                    unSelect={this.state.unSelect}
                />
            )
        }
        return (
            <div>
                <button
                    className={
                        this.state.count > 0
                            ? styles.buttonFocusSelected
                            : styles.buttonFocus
                    }
                    onClick={this.openTypesPopup}
                >
                    Types{' '}
                    {this.state.count === 0 ? (
                        ''
                    ) : (
                        <span
                            style={{ fontWeight: 'bold', paddingLeft: '4px' }}
                        >
                            {this.state.count}
                            /5
                        </span>
                    )}
                </button>
                <p>
                    {this.state.count === 0 ? (
                        ''
                    ) : (
                        <button
                            onClick={this.unSelect}
                            className={styles.cross}
                        />
                    )}
                </p>
                <div style={{ display: 'grid' }}>
                    <span style={{ marginTop: '30px', fontSize: '15px' }}>
                        {this.state.types.websites ? 'Websites, ' : null}
                        {this.state.types.annotations ? 'Annotations, ' : null}
                        {this.state.types.highlights ? 'Highlights, ' : null}
                        {this.state.types.comments ? 'Comments, ' : null}
                        {this.state.types.memex ? 'Memex.links, ' : null}
                    </span>
                </div>
                {show}
            </div>
        )
    }
}

export default Types
