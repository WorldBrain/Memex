import React from 'react'
import { ModalBox } from 'src/common-ui/components/design-library/ModalBox'
import { Link } from 'src/common-ui/components/design-library/actions/Link'
import ProgressBar from 'src/common-ui/components/ProgressBar'
import { ExternalLink } from 'src/common-ui/components/design-library/actions/ExternalLink'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import {
    CenterText,
    TypographyBodyBold,
    TypographyBodyCenter,
    HelpBlock,
    StageBlock,
    ProgressBox,
    Warning,
    WhiteSpacer20,
    WhiteSpacer30,
} from 'src/common-ui/components/design-library/typography'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { CancelAction } from 'src/common-ui/components/design-library/actions/CancelAction'

const styles = require('./styles.css')

export const SyncDeviceScreen = ({
    error,
    stage,
    progressPct,
    handleCancel,
}: {
    error?: string
    stage: string
    progressPct?: number
    handleCancel?: () => void
}) => {
    return (
        <ModalBox
            header={'Setup sync with mobile devices'}
            actions={[]}
            key={`dialog-sync`}
        >
            <ProgressBox>
                <CenterText>
                    <TypographyBodyBold>
                        {'Initial sync is in progress... this may take a while'}
                    </TypographyBodyBold>
                    <TypographyBodyCenter>
                        {'Make sure both devices stay connected'}
                    </TypographyBodyCenter>

                    <div className={styles.progressBar}>
                        {!error ? (
                            <div className={styles.progressBox}>
                                <WhiteSpacer20 />
                                <CancelAction
                                    label={'Cancel'}
                                    onClick={() => false}
                                />
                                {progressPct === undefined ? (
                                    <LoadingIndicator />
                                ) : (
                                    <div className={styles.progressBar}>
                                        <ProgressBar
                                            progress={progressPct * 100}
                                        />
                                        <StageBlock>{`Stage ${stage}`}</StageBlock>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.progressBox}>
                                <Warning>⚠️ Something went wrong</Warning>
                                <PrimaryAction
                                    label={'Retry Syncing'}
                                    onClick={handleCancel}
                                />
                                <WhiteSpacer30 />
                            </div>
                        )}
                    </div>
                    <HelpBlock>
                        <span>{'Problem with syncing? '}</span>
                        <ExternalLink
                            label={'Send a bug report'}
                            href={
                                'https://community.worldbrain.io/c/bug-reports'
                            }
                        />
                        <ExternalLink
                            label={'Help & FAQ'}
                            href={
                                'https://www.notion.so/worldbrain/Troubleshooting-the-Device-Sync-d1ccb11785774c389c621b44f65bb543'
                            }
                        />
                    </HelpBlock>
                </CenterText>
            </ProgressBox>
        </ModalBox>
    )
}
