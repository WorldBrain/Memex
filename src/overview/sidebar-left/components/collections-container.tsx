import { connect } from 'react-redux'

import CollectionsButton from './collections-button'
import { actions as acts } from 'src/overview/sidebar-left/'
import { selectors as filters, actions as filterActs } from 'src/search-filters'

const mapState = (state) => ({
    isListFilterActive: filters.listFilterActive(state),
})

const mapDispatch = (dispatch) => ({
    listBtnClick: () => dispatch(acts.openSidebar()),
    onShowBtnClick: () => dispatch(filterActs.delListFilter()),
})

export default connect(mapState, mapDispatch)(CollectionsButton)
