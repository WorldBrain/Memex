import React from 'react'
import PropTypes from 'prop-types'
import { Router, Route, IndexRedirect } from 'react-router'
import history from './history'

import { withPageTracking } from 'src/common-ui/hocs'
import Layout from './layout'

class MemexRouter extends React.Component {
    static propTypes = {
        routes: PropTypes.array.isRequired,
    }

    constructor(props) {
        super(props)

        this.overviewRoutes = props.routes.filter(route => route.useOwnLayout)
        this.optionsRoutes = props.routes.filter(route => !route.useOwnLayout)
    }

    renderRoutes(routes = []) {
        return routes.map(route => (
            <Route
                key={route.pathname}
                path={route.pathname}
                component={route.component}
            />
        ))
    }

    render() {
        return (
            <Router history={history}>
                <Route path="/">
                    <Route component={withPageTracking(Layout)}>
                        <IndexRedirect to="/blacklist" />
                        {this.renderRoutes(this.optionsRoutes)}
                    </Route>
                    {this.renderRoutes(this.overviewRoutes)}
                </Route>
            </Router>
        )
    }
}

export default MemexRouter
