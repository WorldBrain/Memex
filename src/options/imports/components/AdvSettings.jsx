import React from 'react'
import PropTypes from 'prop-types'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import { IMPORT_TYPE as TYPE } from '../constants'
import { Checkbox } from 'src/common-ui/components'
import settingsStyle from 'src/options/settings/components/settings.css'

import Concurrency from './Concurrency'
import PrevFailedCheckbox from './PrevFailedCheckbox'

import styles from './AdvSettings.css'

const AdvSettings = ({ onPrevFailedToggle, prevFailedValue, ...props }) => (
    <section className={styles.container}>
        <div className={settingsStyle.sectionTitle}>Settings</div>
        <div className={styles.advFunctionality}>
            <ul className={styles.settingsList}>
                <li className={styles.settingsListItem}>
                    <ButtonTooltip
                        tooltipText="Fast, but not full-text searchable"
                        position="bottom"
                    >
                        <Checkbox
                            id="index-imports"
                            handleChange={props.onIndexTitleToggle}
                            isChecked={props.indexTitle}
                        >
                            <label htmlFor="index-imports">
                                Only import title, urls and metadata
                            </label>
                        </Checkbox>
                    </ButtonTooltip>
                </li>
                <li className={styles.settingsListItem}>
                    <PrevFailedCheckbox
                        checked={prevFailedValue}
                        onChange={onPrevFailedToggle}
                    />
                </li>
                <li className={styles.settingsListItem}>
                    <Concurrency {...props} />
                </li>
            </ul>
        </div>
    </section>
)

AdvSettings.propTypes = {
    allowTypes: PropTypes.shape({
        [TYPE.HISTORY]: PropTypes.bool.isRequired,
        [TYPE.BOOKMARK]: PropTypes.bool.isRequired,
        [TYPE.OTHERS]: PropTypes.string.isRequired,
    }).isRequired,
    bookmarkImports: PropTypes.bool.isRequired,
    indexTitle: PropTypes.bool.isRequired,
    onPrevFailedToggle: PropTypes.func.isRequired,
    prevFailedValue: PropTypes.bool.isRequired,
    onBookmarImportsToggle: PropTypes.func.isRequired,
    onIndexTitleToggle: PropTypes.func.isRequired,
}

export default AdvSettings
