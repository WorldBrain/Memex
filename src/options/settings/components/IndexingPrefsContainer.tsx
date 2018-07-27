import { connect } from 'react-redux'

import * as acts from '../actions'
import * as selectors from '../selectors'
import { State } from '../reducer'
import IndexingPrefs, { Props as IndexingPrefsProps } from './IndexingPrefs'

const mapStateToProps = (state): Partial<IndexingPrefsProps> => ({
    bookmarks: selectors.bookmarks(state),
    memexLinks: selectors.memexLinks(state),
    stubs: selectors.stubs(state),
    visits: selectors.visits(state),
    visitDelay: selectors.visitDelay(state),
})

const mapDispatchToProps = (dispatch): Partial<IndexingPrefsProps> => ({
    toggleBookmarks: () => dispatch(acts.toggleBookmarks()),
    toggleLinks: () => dispatch(acts.toggleLinks()),
    toggleStubs: () => dispatch(acts.toggleStubs()),
    toggleVisits: () => dispatch(acts.toggleVisits()),
    handleVisitDelayChange: ev => {
        const el = ev.target as HTMLInputElement
        dispatch(acts.changeVisitDelay(+el.value))
    },
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(IndexingPrefs)
