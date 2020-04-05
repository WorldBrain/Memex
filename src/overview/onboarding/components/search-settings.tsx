import React from 'react'

import { Checkbox, CheckboxToggle } from 'src/common-ui/components'
import { VISIT_DELAY_RANGE } from 'src/options/settings/constants'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'

const styles = require('./search-settings.css')

export interface Props {
    stubs: boolean
    visits: boolean
    bookmarks: boolean
    annotations: boolean
    screenshots: boolean
    showSearchSettings: boolean
    areAllSettingsChecked: boolean
    visitDelay: number
    visitDelayMin: number
    visitDelayMax: number
    toggleAll: CheckboxToggle
    toggleStubs: CheckboxToggle
    toggleAnnotations: CheckboxToggle
    toggleVisits: CheckboxToggle
    toggleBookmarks: CheckboxToggle
    toggleScreenshots: CheckboxToggle
    toggleShowSearchSettings: () => void
    setVisitDelayChange: (e: React.SyntheticEvent<HTMLInputElement>) => void
}

export default class SearchSettings extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = {
        visitDelayMin: VISIT_DELAY_RANGE.MIN,
        visitDelayMax: VISIT_DELAY_RANGE.MAX,
    }

    private renderIndexingMessage() {
        if (this.props.bookmarks && this.props.visits && this.props.annotations && this.props.stubs) {
            return "Index everything after " + this.props.visitDelay + " seconds"
        }

        if (
            !this.props.visits &&
            !this.props.bookmarks &&
            !this.props.annotations &&
            !this.props.stubs
        ) {
            return 'Searchability of visited websites is disabled.'
        }
        const titles = 'Titles and URLs are always searchable.'

        if (
            !this.props.visits &&
            !this.props.bookmarks &&
            !this.props.annotations &&
            this.props.stubs
        ) {
            return titles
        }

        let base = 'You can full-text search all pages you '

        if (this.props.visits) {
            base += `visited for more than ${this.props.visitDelay} seconds, `
        }

        if (this.props.bookmarks) {
            base += 'bookmarked, tagged or put into collections, '
        }

        if (this.props.annotations) {
            base += 'annotated or made highlights on, '
        }

        // Replace any trailing ', ' with '.'
        base = base.slice(0, base.length - 2) + '.'

        if (this.props.stubs) {
            base += ' ' + titles
        }

        return base
    }

    private renderDisabledSettings() {
        return (
            <>
                <div className={styles.settingsText}><strong>Current Settings: </strong>{this.renderIndexingMessage()}</div>
                <SecondaryAction
                    onClick={this.props.toggleShowSearchSettings}
                    label={'Change settings'}
                />
            </>
        )
    }

    render() {
        if (!this.props.showSearchSettings) {
            return this.renderDisabledSettings()
        }

        return (
            <div className={styles.container}>
                <div className={styles.settingsHeader}>General settings</div>
                <Checkbox
                    id="index-stubs"
                    isChecked={this.props.stubs}
                    handleChange={this.props.toggleStubs}
                >
                    Make title and URL always searchable (recommended)
                </Checkbox>
                <div className={styles.settingsHeader}>
                    Full-text search websites and PDFs
                </div>
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
                    Visited for how many seconds?{' '}
                    <input
                        type="number"
                        className={styles.number}
                        value={this.props.visitDelay}
                        onChange={this.props.setVisitDelayChange}
                        min={this.props.visitDelayMin}
                        max={this.props.visitDelayMax}
                    />
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
            </div>
        )
    }
}
