import { connect } from 'react-redux'

import CollectionsButton from './collections-button'
import { actions as acts } from 'src/overview/sidebar-left/'
import { selectors as filters } from 'src/search-filters'

const mapState = (state) => ({
    filteredListName: filters.listNameFilter(state),
})

const mapDispatch = (dispatch) => ({
    listBtnClick: () => dispatch(acts.openSidebar()),
})

export default connect(mapState, mapDispatch)(CollectionsButton)
