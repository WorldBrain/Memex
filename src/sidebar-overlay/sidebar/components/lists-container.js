import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import cx from 'classnames'

import * as actions from 'src/custom-lists/actions'
import * as selectors from 'src/custom-lists/selectors'
import extStyles from 'src/custom-lists/components/overview/sidebar/Index.css'
import MyCollection from 'src/custom-lists/components/overview/sidebar/my-collections'
import CreateListForm from 'src/custom-lists/components/overview/sidebar/CreateListForm'
import ListItem from 'src/custom-lists/components/overview/sidebar/list-item'
import DeleteConfirmModal from 'src/overview/delete-confirm-modal/components/DeleteConfirmModal'
import { CrowdfundingModal } from 'src/common-ui/crowdfunding'
import * as filterActs from 'src/search-filters/actions'
import * as sidebarActs from 'src/sidebar-overlay/sidebar/actions'

class ListContainer extends Component {
    static propTypes = {
        getListFromDB: PropTypes.func.isRequired,
        lists: PropTypes.array.isRequired,
        handleEditBtnClick: PropTypes.func.isRequired,
        setShowCrowdFundingModal: PropTypes.func.isRequired,
        isDeleteConfShown: PropTypes.bool.isRequired,
        resetListDeleteModal: PropTypes.func.isRequired,
        handleCrossBtnClick: PropTypes.func.isRequired,
        handleListItemClick: PropTypes.func.isRequired,
        createPageList: PropTypes.func.isRequired,
        updateList: PropTypes.func.isRequired,
        handleAddPageList: PropTypes.func.isRequired,
        handleDeleteList: PropTypes.func.isRequired,
        toggleCreateListForm: PropTypes.func.isRequired,
        showCreateList: PropTypes.bool.isRequired,
        showCommonNameWarning: PropTypes.bool.isRequired,
        showCrowdFundingModal: PropTypes.bool.isRequired,
        closeCreateListForm: PropTypes.func.isRequired,
        resetUrlDragged: PropTypes.func.isRequired,
        env: PropTypes.oneOf(['overview', 'inpage']).isRequired,
    }

    constructor(props) {
        super(props)
        this.state = {
            listName: null,
            updatedListName: null,
            showWarning: false,
        }
    }

    async componentDidMount() {
        // Gets all the list from the DB to populate the sidebar.
        this.props.getListFromDB()
    }

    setInputRef = el => (this.inputEl = el)

    handleSearchChange = field => event => {
        const { value } = event.target

        this.setState(state => ({
            ...state,
            [field]: value,
        }))
    }

    handleSearchKeyDown = (field, listName = '') => e => {
        if (
            this.props.env === 'inpage' &&
            !(e.ctrlKey || e.metaKey) &&
            /[a-zA-Z0-9-_ ]/.test(String.fromCharCode(e.keyCode))
        ) {
            e.preventDefault()
            e.stopPropagation()

            this.setState(state => ({
                ...state,
                [field]:
                    (state[field] !== null ? state[field] : listName) + e.key,
            }))
        }
    }

    getSearchVal = value => value.trim().replace(/\s\s+/g, ' ')

    handleCreateListSubmit = event => {
        event.preventDefault()
        event.stopPropagation()
        const { value } = event.target.elements['listName']
        // value = list name
        this.props.createPageList(
            this.getSearchVal(value),
            this.vacateInputField,
        )
    }

    vacateInputField = () => {
        this.setState(state => ({
            ...state,
            listName: null,
        }))
    }

    handleUpdateList = ({ id }, index) => event => {
        event.preventDefault()
        const { value } = event.target.elements['listName']
        // value = list name
        this.props.updateList(index, this.getSearchVal(value), id)
        this.setState(state => ({
            ...state,
            updatedListName: null,
        }))
    }

    renderAllLists = () => {
        return this.props.lists.map((list, i) => {
            if (list.isEditing) {
                return (
                    <CreateListForm
                        key={i}
                        onCheckboxClick={this.handleUpdateList(list, i)}
                        handleNameChange={this.handleSearchChange(
                            'updatedListName',
                        )}
                        handleNameKeyDown={this.handleSearchKeyDown(
                            'updatedListName',
                            list.name,
                        )}
                        value={
                            typeof this.state.updatedListName === 'string'
                                ? this.state.updatedListName
                                : list.name
                        }
                        showWarning={this.state.showWarning}
                        setInputRef={this.setInputRef}
                    />
                )
            }

            return (
                <ListItem
                    key={i}
                    listName={list.name}
                    isFiltered={list.isFilterIndex}
                    onEditButtonClick={this.props.handleEditBtnClick(i)}
                    onListItemClick={this.props.handleListItemClick(list, i)}
                    onAddPageToList={this.props.handleAddPageList(list, i)}
                    onCrossButtonClick={this.props.handleCrossBtnClick(list, i)}
                    resetUrlDragged={this.props.resetUrlDragged}
                    isMobileList={list.isMobileList}
                />
            )
        })
    }

    renderCreateList = (shouldDisplayForm, value = null) =>
        shouldDisplayForm ? (
            <CreateListForm
                onCheckboxClick={this.handleCreateListSubmit}
                handleNameChange={this.handleSearchChange('listName')}
                handleNameKeyDown={this.handleSearchKeyDown('listName')}
                value={this.state.listName}
                showWarning={this.props.showCommonNameWarning}
                setInputRef={this.setInputRef}
                closeCreateListForm={this.props.closeCreateListForm}
            />
        ) : null

    render() {
        return (
            <React.Fragment>
                <MyCollection
                    isForInpage
                    handleRenderCreateList={this.props.toggleCreateListForm}
                />

                {this.renderCreateList(this.props.showCreateList)}
                <div className={extStyles.allListsInPage}>
                    <div
                        className={cx(
                            extStyles.wrapper,
                            extStyles.allListsInner,
                        )}
                    >
                        {this.renderAllLists()}
                    </div>
                </div>
                <DeleteConfirmModal
                    message="Delete collection? This does not delete the pages in it"
                    isShown={this.props.isDeleteConfShown}
                    onClose={this.props.resetListDeleteModal}
                    deleteDocs={this.props.handleDeleteList}
                />
                {this.props.showCrowdFundingModal && (
                    <CrowdfundingModal
                        onClose={this.props.setShowCrowdFundingModal(false)}
                        context="collections"
                        learnMoreUrl="https://worldbrain.io/pricing/"
                    />
                )}
            </React.Fragment>
        )
    }
}

const mapStateToProps = state => ({
    lists: selectors.results(state),
    isDeleteConfShown: selectors.isDeleteConfShown(state),
    showCrowdFundingModal: selectors.showCrowdFundingModal(state),
    showCreateList: selectors.showCreateListForm(state),
    showCommonNameWarning: selectors.showCommonNameWarning(state),
})

const mapDispatchToProps = (dispatch, getState) => ({
    ...bindActionCreators(
        {
            resetListDeleteModal: actions.resetListDeleteModal,
            getListFromDB: actions.getListFromDB,
            createPageList: actions.createPageList,
            updateList: actions.updateList,
            toggleCreateListForm: actions.toggleCreateListForm,
            closeCreateListForm: actions.closeCreateListForm,
            resetUrlDragged: actions.resetUrlDragged,
        },
        dispatch,
    ),
    handleEditBtnClick: index => event => {
        event.preventDefault()
        dispatch(actions.showEditBox(index))
    },
    setShowCrowdFundingModal: value => e => {
        e.preventDefault()
        e.stopPropagation()
        dispatch(actions.setShowCrowdFundingModal(value))
    },
    handleCrossBtnClick: ({ id }, index) => event => {
        event.preventDefault()
        dispatch(actions.showListDeleteModal(id, index))
    },
    handleListItemClick: ({ id }, index) => () => {
        dispatch(sidebarActs.setSearchType('page'))
        dispatch(actions.toggleListFilterIndex(index.toString()))
        dispatch(filterActs.toggleListFilter(id.toString()))
    },
    handleAddPageList: ({ id }, index) => (url, isSocialPost) => {
        dispatch(actions.addUrltoList(url, isSocialPost, index, id))
    },
    handleDeleteList: e => {
        e.preventDefault()
        dispatch(actions.deletePageList())
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(ListContainer)
