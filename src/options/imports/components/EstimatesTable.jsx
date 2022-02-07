import React from 'react'
import PropTypes from 'prop-types'
import { LoadingIndicator, Checkbox } from 'src/common-ui/components'
import { IMPORT_TYPE as TYPE, IMPORT_SERVICES as SERVICES } from '../constants'
import classNames from 'classnames'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import localStyles from './Import.css'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import Margin from 'src/dashboard-refactor/components/Margin'

const EstimatesTable = ({
    onAllowHistoryClick,
    onAllowBookmarksClick,
    onAllowPocketClick,
    onAllowHTMLClick,
    onInputImport,
    estimates,
    allowTypes,
    isLoading,
    blobUrl,
}) => (
    <>
        <Row>
            <LabelRow>
                <Checkbox
                    name="bookmarks"
                    id="bookmarks"
                    handleChange={onAllowBookmarksClick}
                    isChecked={allowTypes[TYPE.BOOKMARK]}
                >
                    {' '}
                    <div className={localStyles.labelContainer}>
                        <span className={localStyles.checkboxText}>
                            Browser Bookmarks
                        </span>
                    </div>
                </Checkbox>
            </LabelRow>
            <InfoRow>
                <ImportRemaining>
                    {estimates[TYPE.BOOKMARK].remaining}
                </ImportRemaining>
                <ImportRemainingInfo>not yet imported</ImportRemainingInfo>
            </InfoRow>
        </Row>
        <Row>
            <LabelRow>
                <Checkbox
                    name="html"
                    id="html"
                    isChecked={allowTypes[TYPE.OTHERS] === SERVICES.NETSCAPE}
                    handleChange={onAllowHTMLClick}
                >
                    <div className={localStyles.labelContainer}>
                        <span className={localStyles.checkboxText}>
                            HTML File
                        </span>
                    </div>
                </Checkbox>
                {!isLoading && blobUrl === null && (
                    <UploaderBox>
                        <label
                            className={classNames(localStyles.selectFile, {
                                [localStyles.hidden]:
                                    allowTypes[TYPE.OTHERS] !==
                                    SERVICES.NETSCAPE,
                            })}
                            htmlFor="netscape-file-upload"
                        >
                            Select export file
                        </label>
                        <input
                            type="file"
                            name="netscape-file-upload"
                            id="netscape-file-upload"
                            onChange={onInputImport}
                            disabled={
                                allowTypes[TYPE.OTHERS] !== SERVICES.NETSCAPE
                            }
                        />{' '}
                        {allowTypes[TYPE.OTHERS] === SERVICES.NETSCAPE && (
                            <>
                                <Margin left="5px" />
                                <ButtonTooltip
                                    tooltipText="How can I get that file?"
                                    position="right"
                                >
                                    <Icon
                                        filePath={icons.helpIcon}
                                        heightAndWidth="16px"
                                        onClick={() => {
                                            window.open(
                                                'https://worldbrain.io/tutorials/importing',
                                            )
                                        }}
                                    />
                                </ButtonTooltip>
                            </>
                        )}
                    </UploaderBox>
                )}
            </LabelRow>
            <InfoRow>
                {blobUrl !== null && (
                    <>
                        {isLoading ? (
                            <LoadingIndicator />
                        ) : (
                            <>
                                <ImportRemaining>
                                    {estimates[TYPE.OTHERS].remaining}
                                </ImportRemaining>
                                <ImportRemainingInfo>
                                    not yet imported
                                </ImportRemainingInfo>
                            </>
                        )}
                    </>
                )}
            </InfoRow>
        </Row>
    </>
)

const estimatesShape = PropTypes.shape({
    complete: PropTypes.number.isRequired,
    remaining: PropTypes.number.isRequired,
    timeRemaining: PropTypes.string.isRequired,
})

EstimatesTable.propTypes = {
    // State
    allowTypes: PropTypes.shape({
        [TYPE.HISTORY]: PropTypes.bool.isRequired,
        [TYPE.BOOKMARK]: PropTypes.bool.isRequired,
        [TYPE.OTHERS]: PropTypes.string.isRequired,
    }).isRequired,
    isLoading: PropTypes.bool.isRequired,
    blobUrl: PropTypes.string,
    // Event handlers
    onAllowHistoryClick: PropTypes.func.isRequired,
    onAllowBookmarksClick: PropTypes.func.isRequired,
    onAllowPocketClick: PropTypes.func.isRequired,
    onAllowHTMLClick: PropTypes.func.isRequired,
    onInputImport: PropTypes.func.isRequired,

    // Data
    estimates: PropTypes.shape({
        [TYPE.HISTORY]: estimatesShape.isRequired,
        [TYPE.BOOKMARK]: estimatesShape.isRequired,
        [TYPE.OTHERS]: estimatesShape.isRequired,
    }).isRequired,
}

const ImportRemaining = styled.span`
    font-size: 22px;
    font-weight: bold;
    padding-right: 10px;
    color: ${(props) => props.theme.colors.darkerText};
`

const ImportRemainingInfo = styled.span`
    font-size: 14px;
    color: ${(props) => props.theme.colors.lighterText};
    vertical-align: bottom;
`

const Row = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    height: 60px;
`

const LabelRow = styled.div`
    display: flex;
    align-items: center;
    width: 600px;
    white-space: nowrap;
`

const InfoRow = styled.div`
    display: flex;
    align-items: center;
    width: fill-available;
    justify-content: flex-end;
    padding-right: 100px;
`

const UploaderBox = styled.div`
    margin-left 20px;
    display: flex;
`

export default EstimatesTable
