import React, { Component } from 'react'
import Contributor from './components/contributor'
import Content from './components/content'
import localStyles from './components/styles.css'
import contributors from './constants'
import financialContributors from './financialContributors'

class AcknowledgmentContainer extends Component {
    constructor(props) {
        super(props)
        this.fetchContributors = this.fetchContributors.bind(this)
        this.fetchFinancialContributors = this.fetchFinancialContributors.bind(
            this,
        )
    }

    fetchContributors() {
        return contributors.map((item, id) => {
            return <Contributor key={id} contributor={item} />
        })
    }

    fetchFinancialContributors() {
        return financialContributors.map((item, id) => {
            return <Contributor key={id} contributor={item} />
        })
    }

    render() {
        return (
            <div>
                <Content />
                <div className={localStyles.acknowledgement} />
            </div>
        )
    }
}

export default AcknowledgmentContainer
