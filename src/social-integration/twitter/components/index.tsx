import React, { Component } from 'react'
import { Provider } from 'react-redux'
import { ErrorBoundary, RuntimeError } from 'src/common-ui/components'
import SaveToMemex from './save-to-memex-container'
import configureStore from 'src/social-integration/store'

const store = configureStore()

interface Props {
    element: Element
    url: string
}

class SaveToMemexContainer extends Component<Props> {
    private url: string

    constructor(props: Props) {
        super(props)
        this.url =
            'https://twitter.com' +
            this.props.element.getAttribute('data-permalink-path')
    }

    render() {
        return (
            <Provider store={store}>
                <ErrorBoundary component={RuntimeError}>
                    <SaveToMemex {...this.props} url={this.url} />
                </ErrorBoundary>
            </Provider>
        )
    }
}

export default SaveToMemexContainer
