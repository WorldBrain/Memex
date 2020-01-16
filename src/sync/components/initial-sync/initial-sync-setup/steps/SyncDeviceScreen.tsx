import React from 'react'
import { ModalBox } from 'src/common-ui/components/design-library/ModalBox'
import { Link } from 'src/common-ui/components/design-library/actions/Link'
import ProgressBar from 'src/common-ui/components/ProgressBar'
import { ExternalLink } from 'src/common-ui/components/design-library/actions/ExternalLink'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import {
    CenterText,
    TypographyBodyBlock,
    TypographyBodyBold,
    TypographyBodyCenter,
    HelpBlock,
    StageBlock,
    ProgressBox,
} from 'src/common-ui/components/design-library/typography'

export const SyncDeviceScreen = ({
    error,
    stage,
    progressPct,
}: {
    error?: string
    stage: string
    progressPct?: number
}) => {
    return (
        <ModalBox header={'Setup sync with mobile devices'} actions={[]}>
            <ProgressBox>
                <CenterText>
                    <TypographyBodyBold>
                        {'Initial sync is in progress... this may take a while'}
                    </TypographyBodyBold>
                    <TypographyBodyCenter>
                        {'Make sure both devices stay connected'}
                    </TypographyBodyCenter>

                    <div>
                        {!error ? (
                            <div>
                                <Link
                                    label={'CANCEL'}
                                    onClick={() => false}
                                />
                                {progressPct === undefined ? (
                                    <LoadingIndicator />
                                ) : (
                                    <div>
                                        <ProgressBar
                                            progress={progressPct * 100}
                                        />
                                        <StageBlock>{`Stage ${stage}`}</StageBlock>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <Link
                                    label={'retry syncing'}
                                    onClick={() => false}
                                />
                                Something went wrong
                            </div>
                        )}
                    </div>
                    <HelpBlock>
                        <span>{'Problem with syncing?'}</span>
                        <ExternalLink label={'Send a bug report'} href={''} />
                        <ExternalLink label={'Help & FAQ'} href={''} />
                    </HelpBlock>
                </CenterText>
            </ProgressBox>
        </ModalBox>
    )
}
