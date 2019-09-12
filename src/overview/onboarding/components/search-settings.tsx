import React from 'react'

import { Checkbox, CheckboxToggle } from 'src/common-ui/components'

const styles = require('./search-settings.css')

export interface Props {
    stubs: boolean
    visits: boolean
    bookmarks: boolean
    annotations: boolean
    screenshots: boolean
    showSearchSettings: boolean
    areAllSettingsChecked: boolean
    toggleAll: CheckboxToggle
    toggleStubs: CheckboxToggle
    toggleAnnotations: CheckboxToggle
    toggleVisits: CheckboxToggle
    toggleBookmarks: CheckboxToggle
    toggleScreenshots: CheckboxToggle
    toggleShowSearchSettings: () => void
}

export default class SearchSettings extends React.PureComponent<Props> {
    private renderDisabledSettings() {
        return (
            <>
                <p>
                    All pages you visited more than 5 seconds are full-text
                    searchable
                </p>
                <a
                    className={styles.settingsButton}
                    onClick={this.props.toggleShowSearchSettings}
                >
                    Change settings
                </a>
            </>
        )
    }

    render() {
        if (!this.props.showSearchSettings) {
            return this.renderDisabledSettings()
        }

        return (
            <>
                <h3 className={styles.settingsHeader}>Text search settings</h3>
                <Checkbox
                    id="index-stubs"
                    isChecked={this.props.stubs}
                    handleChange={this.props.toggleStubs}
                >
                    Make title and URL always searchable (recommended)
                </Checkbox>
                <Checkbox
                    id="index-screenshots"
                    isChecked={this.props.screenshots}
                    handleChange={this.props.toggleScreenshots}
                >
                    Capture screenshots (triples disk space requirements)
                </Checkbox>
                <p className={styles.textSearchHeader}>
                    Full-text search websites and PDFs
                </p>
                <Checkbox
                    id="index-all"
                    isChecked={this.props.areAllSettingsChecked}
                    handleChange={this.props.toggleAll}
                >
                    All
                </Checkbox>
                <Checkbox
                    id="index-visits"
                    isChecked={this.props.visits}
                    handleChange={this.props.toggleVisits}
                >
                    Visited for at least X seconds
                </Checkbox>
                <Checkbox
                    id="index-bookmarks"
                    isChecked={this.props.bookmarks}
                    handleChange={this.props.toggleBookmarks}
                >
                    Bookmarked, tagged, or sorted into collections
                </Checkbox>
                <Checkbox
                    id="index-annotations"
                    isChecked={this.props.annotations}
                    handleChange={this.props.toggleAnnotations}
                >
                    Made notes or annotations on
                </Checkbox>
                <a
                    className={styles.settingsButton}
                    onClick={this.props.toggleShowSearchSettings}
                >
                    Back
                </a>
            </>
        )
    }
}
