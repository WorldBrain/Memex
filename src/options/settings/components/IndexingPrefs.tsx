import * as React from 'react'

import { VISIT_DELAY_RANGE } from '../constants'
import { Checkbox, CheckboxToggle } from '../../../common-ui/components'
const styles = require('./settings.css')

export interface Props {
    bookmarks: boolean
    memexLinks: boolean
    stubs: boolean
    screenshots: boolean
    visits: boolean
    visitDelay: number
    visitDelayMin?: number
    visitDelayMax?: number
    toggleBookmarks: CheckboxToggle
    toggleLinks: CheckboxToggle
    toggleStubs: CheckboxToggle
    toggleScreenshots: CheckboxToggle
    toggleVisits: CheckboxToggle
    handleVisitDelayChange: (e: React.SyntheticEvent<HTMLInputElement>) => void
}

class IndexingPrefs extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = {
        visitDelayMin: VISIT_DELAY_RANGE.MIN,
        visitDelayMax: VISIT_DELAY_RANGE.MAX,
    }

    render() {
        return (
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Indexing Preferences</div>
                <h3 className={styles.infoText}>
                    Define which pages you would like to search.
                </h3>
                <Checkbox
                    id="index-stubs"
                    isChecked={this.props.stubs}
                    handleChange={this.props.toggleStubs}
                >
                    Make title and URL of every visit searchable
                </Checkbox>

                <div className={styles.subSubTitle}>
                    Make websites full-text searchable that I...?
                </div>
                <Checkbox
                    id="index-visits"
                    isChecked={this.props.visits}
                    handleChange={this.props.toggleVisits}
                >
                    visited for this many seconds{' '}
                    <input
                        type="number"
                        value={this.props.visitDelay}
                        onChange={this.props.handleVisitDelayChange}
                        min={this.props.visitDelayMin}
                        max={this.props.visitDelayMax}
                    />
                </Checkbox>
                <Checkbox
                    id="index-bookmarks"
                    isChecked={this.props.bookmarks}
                    handleChange={this.props.toggleBookmarks}
                >
                    bookmarked, tagged, or sorted into collections
                </Checkbox>
                <Checkbox
                    id="index-links"
                    isChecked={this.props.memexLinks}
                    handleChange={this.props.toggleLinks}
                >
                    annotated or added notes to
                </Checkbox>
            </div>
        )
    }
}

export default IndexingPrefs
