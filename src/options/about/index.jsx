import React from 'react'
import localStyles from './styles.css'

const About = () => (
    <div className={localStyles.main}>
        <div className={localStyles.title}> About Us</div>

        <div className={localStyles.content}>
            <div className={localStyles.title2}>Vision:</div>
            <div className={localStyles.content}>
                At WorldBrain, we work towards a scalable and sustainable
                solution to misinformation. Doing so by creating a collaborative
                search engine by enabling you all to connect your Memexes with
                each other. In this network, you'll be able to effortlessly
                exchange the most useful content and important contextual
                information you found in your web-research
            </div>
        </div>
        <div className={localStyles.content}>
            <div className={localStyles.title2}>Changelog</div>
            <ul className={localStyles.list}>
                <li className={localStyles.list_element}>
                    <h4>On Aug 12,2017 - version 0.2.4</h4>
                </li>
                <li className={localStyles.list_element}>
                    <h4>On Jul 28,2017 - version 0.2.3</h4>
                </li>
                <li className={localStyles.list_element}>
                    <h4>On Jul 8,2017 - version 0.2.1</h4>
                </li>
                <li className={localStyles.list_element}>
                    <h4>On Jul 8,2017 - version 0.2.0</h4>
                </li>
            </ul>
        </div>
        <div className={localStyles.content}>
            <div className={localStyles.title2}>Acknowledgements</div>
        </div>
    </div>
)
export default About
