import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
// import ReactDOM from 'react-dom'

import { actions, selectors } from '../../../'
import styles from '../../stylesheets/type-filter-styles/TypesPopup.module.css'

class TypesPopup extends PureComponent {
    static propTypes = {
        prevTypes: PropTypes.object.isRequired,
        unSelect: PropTypes.bool.isRequired,
        checkCount: PropTypes.func.isRequired,
        typeStatus: PropTypes.object.isRequired,
        showPopup: PropTypes.bool.isRequired,
        // showfilteredTypes: PropTypes.bool.isRequired,
        // toggleFilterTypes: PropTypes.func.isRequired,
    }

    state = {
        type: {
            websites: false,
            annotations: false,
            highlights: false,
            comments: false,
            memex: false,
        },
        showPopup: false,
    }

    componentDidMount() {
        const types = {
            websites: false,
            annotations: false,
            highlights: false,
            comments: false,
            memex: false,
        }
        const typ = {
            ...this.state.type,
            websites: this.props.prevTypes.websites,
            annotations: this.props.prevTypes.annotations,
            comments: this.props.prevTypes.comments,
            highlights: this.props.prevTypes.highlights,
            memex: this.props.prevTypes.memex,
        }
        // console.log(this.props.prevTypes)
        if (this.props.unSelect) {
            this.setState({
                type: types,
                showPopup: false,
            })
        } else {
            this.setState({
                type: typ,
            })
        }
    }

    selectedType = ev => {
        const { name } = ev.target
        if (name === 'websites') {
            this.setState(prevState => ({
                type: {
                    ...prevState.type,
                    [name]: !prevState.type.websites,
                },
            }))
        } else if (name === 'annotations') {
            this.setState(prevState => ({
                type: {
                    ...prevState.type,
                    [name]: !prevState.type.annotations,
                },
            }))
        } else if (name === 'highlights') {
            this.setState(prevState => ({
                type: {
                    ...prevState.type,
                    [name]: !prevState.type.highlights,
                },
            }))
        } else if (name === 'comments') {
            this.setState(prevState => ({
                type: {
                    ...prevState.type,
                    [name]: !prevState.type.comments,
                },
            }))
        } else {
            this.setState(prevState => ({
                type: {
                    ...prevState.type,
                    [name]: !prevState.type.memex,
                },
            }))
        }
    }

    render() {
        let show = null
        let count = 0
        const arr = Object.values(this.state.type)
        arr.map((type, index) => {
            if (type && index < 5) {
                count++
            }
        })
        this.props.checkCount(count)
        this.props.typeStatus(this.state.type)

        // console.log(this.props.prevTypes)

        if (this.props.showPopup) {
            show = (
                <div className={styles.typesStyle}>
                    <div className={styles.tagName1}>
                        <p>Websites</p>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                name="websites"
                                checked={this.props.prevTypes.websites}
                                onChange={this.selectedType}
                            />
                            <span
                                className={[styles.slider, styles.round].join(
                                    ' ',
                                )}
                            />
                        </label>
                    </div>

                    <div className={styles.tagName}>
                        <p>Annotations</p>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                name="annotations"
                                checked={this.props.prevTypes.annotations}
                                onChange={this.selectedType}
                            />
                            <span
                                className={[styles.slider, styles.round].join(
                                    ' ',
                                )}
                            />
                        </label>
                    </div>

                    <div className={styles.tagName}>
                        <p>Highlights</p>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                name="highlights"
                                checked={this.props.prevTypes.highlights}
                                onChange={this.selectedType}
                            />
                            <span
                                className={[styles.slider, styles.round].join(
                                    ' ',
                                )}
                            />
                        </label>
                    </div>

                    <div className={styles.tagName}>
                        <p>Comments</p>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                name="comments"
                                checked={this.props.prevTypes.comments}
                                onChange={this.selectedType}
                            />
                            <span
                                className={[styles.slider, styles.round].join(
                                    ' ',
                                )}
                            />
                        </label>
                    </div>

                    <div className={styles.tagName4}>
                        <p>Memex.links</p>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                name="memex"
                                checked={this.props.prevTypes.memex}
                                onChange={this.selectedType}
                            />
                            <span
                                className={[styles.slider, styles.round].join(
                                    ' ',
                                )}
                            />
                        </label>
                    </div>
                </div>
            )
        }
        return <div>{show}</div>
    }
}

const mapStateToProps = state => ({
    showfilteredTypes: selectors.filterTypes(state),
})

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            toggleFilterTypes: actions.toggleFilterTypes,
        },
        dispatch,
    ),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(TypesPopup)
