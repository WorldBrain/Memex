import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import RibbonContainer from '../../ribbon'
import SidebarContainer, {
    State as SidebarState,
    selectors as sidebarSelectors,
} from '../../../sidebar-common'

interface StateProps {
    isSidebarOpen: boolean
}

interface DispatchProps {}

interface OwnProps {
    handleRemoveRibbon: () => void
}

type Props = StateProps & DispatchProps & OwnProps

/* tslint:disable-next-line variable-name */
const RibbonSidebarController = ({
    handleRemoveRibbon,
    isSidebarOpen,
}: Props) => (
    <React.Fragment>
        {!isSidebarOpen && (
            <RibbonContainer handleRemoveRibbon={handleRemoveRibbon} />
        )}
        <SidebarContainer env="inpage" />
    </React.Fragment>
)

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    SidebarState
> = state => ({
    isSidebarOpen: sidebarSelectors.isOpen(state),
})

export default connect(mapStateToProps)(RibbonSidebarController)
