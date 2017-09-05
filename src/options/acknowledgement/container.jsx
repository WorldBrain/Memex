import React, { Component } from 'react'
import Contributor from './components/contributor'
import Content from './components/content'
import localStyles from './components/styles.css'
import PropTypes from 'prop-types'
import contributors from './constants'

class AcknowledgmentContainer extends Component {
	constructor(props) {
	  super(props);
	  this.fetchContributors = this.fetchContributors.bind(this);
	
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

				<span className={localStyles.contribute}>How to contribue?</span>
           	</div>
        )
    }
}


export default AcknowledgmentContainer
