import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { slide as Menu } from 'react-burger-menu'
import { bindActionCreators } from 'redux'

import { actions, selectors } from 'src/custom-lists'
import extStyles from './Index.css'
import MyCollection from './MyCollections'
import CreateListForm from './CreateListForm'
import ListItem from './ListItem'
import DeleteConfirmModal from './DeleteConfirmModal'
import { actions as filterActs } from 'src/overview/filters'

import { styles } from './ReactBurgerMenu'

class ListContainer extends Component {
    static propTypes = {
        getListFromDB: PropTypes.func.isRequired,
        lists: PropTypes.array.isRequired,
        handleEditBtnClick: PropTypes.func.isRequired,
        isDeleteConfShown: PropTypes.bool.isRequired,
        resetListDeleteModal: PropTypes.func.isRequired,
        handleCrossBtnClick: PropTypes.func.isRequired,
        handleListItemClick: PropTypes.func.isRequired,
        resetFilters: PropTypes.func.isRequired,
        createPageList: PropTypes.func.isRequired,
        updateList: PropTypes.func.isRequired,
        handleAddPageList: PropTypes.func.isRequired,
        handleDeleteList: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props)
        this.state = {
            showCreateList: false,
        }
    }

    componentWillMount() {
        // Gets all the list from the DB to populate the sidebar.
        this.props.getListFromDB()
    }

    handleRenderCreateList = () =>
        this.setState({
            showCreateList: !this.state.showCreateList,
        })

    // TODO: change this method;
    handleCreateListSubmit = event => {
        event.preventDefault()
        const { value } = event.target.elements['listName']
        // value = list name
        this.props.createPageList(value)
        this.setState({
            showCreateList: false,
        })
    }

    handleUpdateList = ({ _id }, index) => event => {
        event.preventDefault()
        const { value } = event.target.elements['listName']
        // value = list name
        this.props.updateList(index, value, _id)
    }

    renderAllLists = () => {
        return this.props.lists.map((list, i) => {
            return !list.isEditing ? (
                <ListItem
                    key={i}
                    listName={list.name}
                    isFiltered={list.isFilterIndex}
                    onEditButtonClick={this.props.handleEditBtnClick(i)}
                    onListItemClick={this.props.handleListItemClick(
                        list._id,
                        i,
                    )}
                    onAddPageToList={this.props.handleAddPageList(list, i)}
                    onCrossButtonClick={this.props.handleCrossBtnClick(list, i)}
                />
            ) : (
                <CreateListForm
                    key={i}
                    onCheckboxClick={this.handleUpdateList(list, i)}
                    value={list.name}
                />
            )
        })
    }

    renderCreateList = (shouldDisplayForm, value = null) =>
        shouldDisplayForm ? (
            <CreateListForm onCheckboxClick={this.handleCreateListSubmit} />
        ) : null

    render() {
        return (
            <div>
                <div>
                    <Menu
                        styles={styles}
                        noOverlay
                        customBurgerIcon={<img src="/img/sidebar_icon.svg" />}
                        customCrossIcon={<img src="/img/cross.svg" />}
                    >
                        <a
                            onClick={this.props.resetFilters}
                            className={extStyles.showAll}
                        >
                            Show All
                        </a>

                        <hr className={extStyles.hr} />

                        <MyCollection
                            handleRenderCreateList={this.handleRenderCreateList}
                        />

                        {this.renderCreateList(this.state.showCreateList)}
                        <div className={extStyles.allLists}>
                            {this.renderAllLists()}
                        </div>
                        <DeleteConfirmModal
                            isShown={this.props.isDeleteConfShown}
                            onClose={this.props.resetListDeleteModal}
                            deleteList={this.props.handleDeleteList}
                        />
                    </Menu>
                </div>
            </div>
        )
    }
}

const mapStateToProps = state => ({
    lists: selectors.results(state),
    isDeleteConfShown: selectors.isDeleteConfShown(state),
})

const mapDispatchToProps = (dispatch, getState) => ({
    ...bindActionCreators(
        {
            resetListDeleteModal: actions.resetListDeleteModal,
            resetFilters: filterActs.resetFilters,
            getListFromDB: actions.getListFromDB,
            createPageList: actions.createPageList,
            updateList: actions.updateList,
        },
        dispatch,
    ),
    listStorageHandler: () => dispatch(actions.listStorage()),
    handleEditBtnClick: index => event => {
        event.preventDefault()
        dispatch(actions.showEditBox(index))
    },
    handleCrossBtnClick: ({ _id }, index) => event => {
        event.preventDefault()
        dispatch(actions.showListDeleteModal(_id, index))
    },
    handleListItemClick: (_id, index) => () => {
        dispatch(actions.toggleListFilterIndex(index))
        dispatch(filterActs.toggleListFilter(_id))
    },
    handleAddPageList: ({ _id }, index) => url => {
        dispatch(actions.addUrltoList(url, index, _id))
    },
    handleDeleteList: e => {
        e.preventDefault()
        dispatch(actions.deletePageList())
    },
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(ListContainer)
