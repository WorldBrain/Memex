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
            <div className={styles.block}>
                <h1 className={styles.header}>Indexing Preferences</h1>
                <h3 className={styles.subHeader}>
                    Which websites do you want to make full-text searchable?
                </h3>
                <Checkbox
                    id="index-stubs"
                    isChecked={this.props.stubs}
                    handleChange={this.props.toggleStubs}
                >
                    Make title and URL always searchable (recommended)
                </Checkbox>
                <Checkbox
                    id="index-visits"
                    isChecked={this.props.visits}
                    handleChange={this.props.toggleVisits}
                >
                    Visited for at least{' '}
                    <input
                        type="number"
                        value={this.props.visitDelay}
                        onChange={this.props.handleVisitDelayChange}
                        min={this.props.visitDelayMin}
                        max={this.props.visitDelayMax}
                    />{' '}
                    seconds
                </Checkbox>
                <Checkbox
                    id="index-screenshots"
                    isChecked={this.props.screenshots}
                    handleChange={this.props.toggleScreenshots}
                >
                    Capture screenshots (triples disk space requirements)
                </Checkbox>
                <Checkbox
                    id="index-bookmarks"
                    isChecked={this.props.bookmarks}
                    handleChange={this.props.toggleBookmarks}
                >
                    Bookmarked, tagged, or sorted into collections
                </Checkbox>
                <Checkbox
                    id="index-links"
                    isChecked={this.props.memexLinks}
                    handleChange={this.props.toggleLinks}
                >
                    Made notes or annotations on
                </Checkbox>
            </div>
        )
    }
}

export default IndexingPrefs
