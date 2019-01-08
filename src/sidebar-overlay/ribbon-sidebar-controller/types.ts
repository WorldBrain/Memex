/**
 * This file contains any type declarations pertinent to RibbonSidebarController
 * Default export is the component's state's type declaration, which also
 * happens to be the Root State for the entire 'sidebar-overlay' component.
 */

import { State as RibbonState } from '../ribbon'
import { State as SidebarState } from '../../sidebar-common'

export default interface RootState {
    ribbon: RibbonState
    sidebar: SidebarState
}
