import { UILogic } from 'ui-logic-core'
import type {
    DashboardResultsDependencies,
    DashboardResultsEvent,
    DashboardResultsState,
} from 'src/overview/components/DashboardResultsContainer/types'

export default class DashboardResultsLogic extends UILogic<
    DashboardResultsState,
    DashboardResultsEvent
> {
    constructor(private dependencies: DashboardResultsDependencies) {
        super()
    }

    getInitialState(): DashboardResultsState {
        return {
            readerShow: false,
            readerUrl: null,
        }
    }
}
