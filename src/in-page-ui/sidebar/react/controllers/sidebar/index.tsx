import * as React from 'react'
import {
    SidebarControllerDependencies,
    SidebarControllerState,
    SidebarControllerLogic,
    SidebarControllerEvents,
} from './logic'
import { StatefulUIElement } from 'src/util/ui-logic'
import Sidebar from '../../components/sidebar'

export interface SidebarControllerProps extends SidebarControllerDependencies {}

export default class SidebarController extends StatefulUIElement<
    SidebarControllerProps,
    SidebarControllerState,
    SidebarControllerEvents
> {
    constructor(props) {
        super(props, new SidebarControllerLogic(props))
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
        return <Sidebar isLoading={false} isOpen={true} env={'inpage'} />
    }
}
