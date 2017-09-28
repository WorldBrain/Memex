import React, { Component } from 'react'
import Contributor from './components/contributor'
import Content from './components/content'
import localStyles from './components/styles.css'
import PropTypes from 'prop-types'
import contributors from './constants'
import financialContributors from './financialContributors'

class AcknowledgmentContainer extends Component {
	constructor(props) {
	 	super(props);
	  	this.fetchContributors = this.fetchContributors.bind(this);
		this.fetchFinancialContributors = this.fetchFinancialContributors.bind(this);
	}

	fetchContributors() {
		return (
            contributors.map((item, id) => {
                return (
                	<Contributor
                		key={id}
	                    contributor={item}
	                />
	            )
            })
        );
	}

	fetchFinancialContributors() {
		return (
            financialContributors.map((item, id) => {
                return (
                	<Contributor
                		key={id}
	                    contributor={item}
	                />
	            )
            })
        );
	}

	render() {
        return (
           	<div>
           		<Content />
           		<div className={localStyles.acknowledgement}>
					<div className={localStyles.ul}>
		           		{this.fetchContributors()}
					</div>
				</div>
				<div className={localStyles.col_title}>FINANCIAL COLLABORATORS</div>
				<div className={localStyles.acknowledgement}>
					<div className={localStyles.ul}>
		           		{this.fetchFinancialContributors()}
					</div>
				</div>
           	</div>
        )
    }
}


export default AcknowledgmentContainer
