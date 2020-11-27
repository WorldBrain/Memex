import { SearchResultsLogic, Events } from './logic'
import { RootState as State, SearchResultsDependencies } from './types'
import { StatefulUIElement } from 'src/util/ui-logic'

export interface Props extends SearchResultsDependencies {}

export class SearchResultsContainer extends StatefulUIElement<
    Props,
    State,
    Events
> {
    constructor(props: Props) {
        super(props, new SearchResultsLogic(props))
    }

    render() {
        return false
    }
}
