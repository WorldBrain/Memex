import { connect } from 'react-redux'

import CollectionsButton from './collections-button'
import * as acts from 'src/overview/sidebar-left//actions'
import { selectors as filters, actions as filterActs } from 'src/search-filters'
import { selectors as lists } from 'src/custom-lists'
import * as selectors from '../selectors'

const mapState = state => ({
    activeCollectionName: lists.activeCollectionName(state),
    isListFilterActive: filters.listFilterActive(state),
    isSidebarLocked: selectors.sidebarLocked(state),
})

const mapDispatch = dispatch => ({
    listBtnClick: () => dispatch(acts.openSidebar()),
    onShowBtnClick: () => dispatch(filterActs.delListFilter()),
})

export default connect(mapState, mapDispatch)(CollectionsButton)
