import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import RibbonContainer from '../../ribbon'
import RootState from '../types'
import SidebarContainer, { selectors as sidebarSelectors } from '../../sidebar'

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
        {isSidebarOpen && <SidebarContainer />}
    </React.Fragment>
)

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    RootState
> = state => ({
    isSidebarOpen: sidebarSelectors.isOpen(state),
})

export default connect(mapStateToProps)(RibbonSidebarController)
