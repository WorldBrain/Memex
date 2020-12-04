import { DashboardLogic } from './logic'
import { RootState, Events, DashboardDependencies } from './types'
import { StatefulUIElement } from 'src/util/ui-logic'

export interface Props extends DashboardDependencies {}

export class DashboardContainer extends StatefulUIElement<
    Props,
    RootState,
    Events
> {
    constructor(props: Props) {
        super(props, new DashboardLogic(props))
    }

    render() {
        return false
    }
}
