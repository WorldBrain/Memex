import * as React from 'react'
import {
    SidebarContainerDependencies,
    SidebarContainerState,
    SidebarContainerLogic,
    SidebarContainerEvents,
} from './logic'
import { StatefulUIElement } from 'src/util/ui-logic'
import Sidebar from '../../components/sidebar'

export interface SidebarContainerProps extends SidebarContainerDependencies {}

export default class SidebarContainer extends StatefulUIElement<
    SidebarContainerProps,
    SidebarContainerState,
    SidebarContainerEvents
> {
    constructor(props) {
        super(props, new SidebarContainerLogic(props))
    }

    componentDidMount() {
        this.props.sidebarEvents.on('showSidebar', this.showSidebar)
        this.props.sidebarEvents.on('hideSidebar', this.hideSidebar)
    }

    componentWillUnmount() {
        this.props.sidebarEvents.removeListener('showSidebar', this.showSidebar)
        this.props.sidebarEvents.removeListener('hideSidebar', this.hideSidebar)
    }

    showSidebar = () => {
        this.processEvent('show', null)
    }

    hideSidebar = () => {
        this.processEvent('hide', null)
    }

    render() {
        return null
        // return <Sidebar isLoading={false} isOpen={true} env={'inpage'} />
    }
}
