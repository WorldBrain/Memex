import React, { PureComponent, MouseEventHandler, MouseEvent } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import Waypoint from 'react-waypoint'
import reduce from 'lodash/fp/reduce'

import { selectors as opt } from 'src/options/settings'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import ResultItem from 'src/common-ui/components/result-item'
import ResultList from './ResultList'
import TagHolder from 'src/common-ui/components/tag-holder'
import * as constants from '../constants'
import { RootState } from 'src/options/types'
import { Result, ResultsByUrl } from '../../types'
import * as selectors from '../selectors'
import * as acts from '../actions'
import { actions as listActs } from 'src/custom-lists'
import { acts as deleteConfActs } from '../../delete-confirm-modal'
import { actions as filterActs, selectors as filters } from 'src/search-filters'
import { PageUrlsByDay } from 'src/search/background/types'
import { getLocalStorage } from 'src/util/storage'
import { TAG_SUGGESTIONS_KEY } from 'src/constants'
import niceTime from 'src/util/nice-time'
import { Annotation } from 'src/annotations/types'
import TagPicker from 'src/tags/ui/TagPicker'
import { auth, tags, collections } from 'src/util/remote-functions-background'
import { HoverBoxDashboard as HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import { PageNotesCopyPaster } from 'src/copy-paster'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { RemoteCopyPasterInterface } from 'src/copy-paster/background/types'
import { formateCalendarTime } from '@worldbrain/memex-common/lib/utils/date-time'

const styles = require('./ResultList.css')

interface LocalState {}

export interface StateProps {}

export interface DispatchProps {}

export interface OwnProps {}

export type Props = StateProps & DispatchProps & OwnProps

class ResultListContainer extends PureComponent<Props, LocalState> {
    render() {
        return null
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = (
    state,
) => ({})

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = (
    dispatch,
    props,
) => ({})

export default connect(mapState, mapDispatch)(ResultListContainer)
