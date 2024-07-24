import React from 'react'
import PropTypes from 'prop-types'
import Checkbox from 'src/common-ui/components/Checkbox'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { IMPORT_TYPE as TYPE, IMPORT_SERVICES as SERVICES } from '../constants'
import classNames from 'classnames'
import localStyles from './Import.css'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import Margin from 'src/dashboard-refactor/components/Margin'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

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
                    label={'Browser Bookmarks'}
                />
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
                    label={'HTML File'}
                />
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
                                <TooltipBox
                                    tooltipText="How can I get that file?"
                                    placement="right"
                                    getPortalRoot={null}
                                >
                                    <Icon
                                        filePath={icons.helpIcon}
                                        heightAndWidth="16px"
                                        onClick={() => {
                                            window.open(
                                                'https://tutorials.memex.garden/tutorials/importing-to-memex-from-other-services',
                                            )
                                        }}
                                    />
                                </TooltipBox>
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
    color: ${(props) => props.theme.colors.white};
`

const ImportRemainingInfo = styled.span`
    font-size: 14px;
    color: ${(props) => props.theme.colors.greyScale5};
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
    margin-left: 20px;
    display: flex;
`

export default EstimatesTable
