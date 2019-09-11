import React from 'react'

import { Checkbox, CheckboxToggle } from 'src/common-ui/components'

const styles = require('./search-settings.css')

export interface Props {
    stubs: boolean
    visits: boolean
    bookmarks: boolean
    annotations: boolean
    screenshots: boolean
    collections: boolean
    showSearchSettings: boolean
    toggleAll: CheckboxToggle
    toggleStubs: CheckboxToggle
    toggleAnnotations: CheckboxToggle
    toggleVisits: CheckboxToggle
    toggleBookmarks: CheckboxToggle
    toggleCollections: CheckboxToggle
    toggleScreenshots: CheckboxToggle
    toggleShowSearchSettings: () => void
}

export default class SearchSettings extends React.PureComponent<Props> {
    private areAllChecked() {
        return (
            this.props.visits &&
            this.props.bookmarks &&
            this.props.annotations &&
            this.props.collections
        )
    }

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
                    Settings
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
                    Make title, visit time and URL always searchable
                </Checkbox>
                <Checkbox
                    id="index-screenshots"
                    isChecked={this.props.screenshots}
                    handleChange={this.props.toggleScreenshots}
                >
                    Capture screenshot thumbnails
                </Checkbox>
                <p className={styles.textSearchHeader}>
                    Full-text search websites and PDFs
                </p>
                <Checkbox
                    id="index-all"
                    isChecked={this.areAllChecked()}
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
                    Bookmarked in browser or starred with Memex
                </Checkbox>
                <Checkbox
                    id="index-annotations"
                    isChecked={this.props.annotations}
                    handleChange={this.props.toggleAnnotations}
                >
                    Made notes or annotations on
                </Checkbox>
                <Checkbox
                    id="index-collections"
                    isChecked={this.props.collections}
                    handleChange={this.props.toggleCollections}
                >
                    Tagged or sorted into collections
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
