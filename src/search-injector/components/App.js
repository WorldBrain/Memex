import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Result from './Result'
import BadSearchTerm from './BadSearchTerm'
import {
    OVER_SEARCH_RESULT,
    ALONGSIDE_SEARCH_RESULT,
    MAXIMIZE,
    MINIMIZE,
    SETTINGS_ICON,
    MEMEX_LOGO,
} from '../constants'

import Undo from './Undo'
import styles from './App.css'
class App extends Component {
    static propTypes = {
        searchResult: PropTypes.object.isRequired,
        openOverview: PropTypes.func.isRequired,
        handleInjectionPosition: PropTypes.func.isRequired,
        injectionPosition: PropTypes.string.isRequired,
        handleHideResults: PropTypes.func.isRequired,
        resultLimit: PropTypes.number.isRequired,
        showResultState: PropTypes.string.isRequired,
        handleMaximizeMinimize: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props)
        this.state = {
            memexLogo: '#',
            settingsIcon: '#',
            value: null,
            remove: false,
            hide: false,
        }
        this.unrenderAll = this.unrenderAll.bind(this)
    }

    async componentWillMount() {
        const memexLogo = await browser.extension.getURL(MEMEX_LOGO)
        const settingsIcon = await browser.extension.getURL(SETTINGS_ICON)
        console.log(this.props.showResultState)

        this.setState({
            memexLogo,
            hide: this.props.showResultState !== MAXIMIZE,
            settingsIcon,
        })
    }

    renderResultItems() {
        const resultItems = this.props.searchResult.docs
            .slice(0, this.props.resultLimit)
            .map((doc, i) => <Result key={i} {...doc} />)
        return resultItems
    }

    renderResults() {
        const { searchResult } = this.props
        if (searchResult.isBadTerm) {
            return (
                <BadSearchTerm>
                    This is too common term to be searched.
                </BadSearchTerm>
            )
        } else if (searchResult.docs.length === 0) {
            return <BadSearchTerm>Nothing in you Memex Memory.</BadSearchTerm>
        } else {
            return this.renderResultItems()
        }
    }

    renderShowMoreResults = () => {
        const { resultsExhausted } = this.props.searchResult
        if (!resultsExhausted) {
            return (
                <div
                    className={styles.showMore}
                    onClick={this.props.openOverview}
                >
                    Show All Results.
                </div>
            )
        }
    }

    renderDropDown = () => (
        <div className={styles.dropdown}>
            <div className={styles.settingsIconContainer}>
                <img
                    alt="Settings icon"
                    className={styles.settingsIcon}
                    src={this.state.settingsIcon}
                />
            </div>
            <div className={styles.dropdownContent}>
                <a onClick={this.changeAppRender} href="#">
                    {!this.renderCSS()
                        ? 'Move Results To Side'
                        : 'Move Results Over'}
                </a>
                <a onClick={this.handleMaxMin} href="#">
                    {this.state.hide ? 'Maximize' : 'Minimize'}
                </a>
                <a onClick={this.handleHide} href="#">
                    Hide Results
                </a>
            </div>
        </div>
    )

    // TODO: Testing phase
    // Not Rerender the whole container but only change it using state and
    // consequently change the value in local storage.
    handleMaxMin = () => {
        const resultState = !this.state.hide ? MINIMIZE : MAXIMIZE
        this.props.handleMaximizeMinimize(resultState)
        this.setState({
            hide: !this.state.hide,
        })
    }

    // This Handles Hiding
    handleHide = () => {
        // A timeout set for displaying things
        console.log('Hide')

        const timer = setTimeout(() => {
            this.unrenderAll()
        }, 10000)
        this.setState({
            remove: true,
            timer,
        })
    }

    changeAppRender = () => {
        const position = this.renderCSS()
            ? OVER_SEARCH_RESULT
            : ALONGSIDE_SEARCH_RESULT
        this.props.handleInjectionPosition(position)
    }

    // Handles undoing the hide button click by clearing the timeout
    handleUndo = () => {
        clearTimeout(this.state.timer)
        this.setState({
            remove: false,
        })
    }

    // Toggling the Injection feature
    async unrenderAll() {
        await this.props.handleHideResults()
    }

    // TODO: Comeup with a more general name and solution
    renderCSS = () => this.props.injectionPosition !== OVER_SEARCH_RESULT

    render() {
        console.log(this.state.settingsIcon)

        return (
            <div
                className={
                    this.renderCSS()
                        ? styles.styleSide
                        : styles.searchResultContainer
                }
            >
                {!this.state.remove ? (
                    <div>
                        {this.renderDropDown()}
                        <div>
                            <h3 className={styles.heading}>
                                You have{' '}
                                {this.props.searchResult
                                    ? this.props.searchResult.totalCount
                                    : ''}{' '}
                                Results in Memex memory.
                            </h3>
                            {this.renderShowMoreResults()}
                            <div className={styles.logoContainer}>
                                <img
                                    alt="memex Logo"
                                    className={styles.logo}
                                    src={this.state.memexLogo}
                                />
                            </div>
                            <div
                                className={[
                                    styles.results,
                                    this.state.hide && styles.resultsCollapsed,
                                ].join(' ')}
                            >
                                <ul style={{ listStyleType: 'none' }}>
                                    {this.renderResults()}
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Undo handleUndo={this.handleUndo} />
                )}
            </div>
        )
    }
}

export default App
