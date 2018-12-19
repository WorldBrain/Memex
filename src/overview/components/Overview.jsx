import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import propTypes from 'prop-types'

import Sidebar from '../sidebar'
import { DeleteConfirmModal } from '../delete-confirm-modal'
import {
    SidebarContainer as SidebarLeft,
    SidebarIconsContainer as SidebarIcons,
} from '../sidebar-left'
import { Header, acts as searchBarActs } from '../search-bar'
import { Results } from '../results'
import Head from '../../options/containers/Head'
import DragElement from './DragElement'
import { Tooltip } from '../tooltips'

class Overview extends PureComponent {
    static propTypes = {
        init: propTypes.func.isRequired,
    }

    componentDidMount() {
        this.props.init()
    }

    render() {
        return (
            <React.Fragment>
                <Head />
                <Header />
                <SidebarIcons />
                <SidebarLeft />
                <Results />
                <DeleteConfirmModal />
                <DragElement />
                <Sidebar />
                <Tooltip />
            </React.Fragment>
        )
    }
}

export default connect(
    null,
    dispatch => ({ init: () => dispatch(searchBarActs.init()) }),
)(Overview)
