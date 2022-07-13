// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {MutableRefObject, ReactNode, useEffect, useMemo, useState} from 'react'

import './searchDialog.scss'
import {FormattedMessage} from 'react-intl'

import {debounce} from 'lodash'

import Dialog from '../dialog'
import {Utils} from '../../utils'
import Search from '../../widgets/icons/search'
import { Constants } from '../../constants'

type Props = {
    onClose: () => void
    title: string
    subTitle?: string | ReactNode
    searchHandler: (query: string) => Promise<Array<ReactNode>>
    initialData?: Array<ReactNode>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    refs: MutableRefObject<any>
}

export const EmptySearch = () => (
    <div className='noResults introScreen'>
        <div className='iconWrapper'>
            <Search/>
        </div>
        <h4 className='text-heading4'>
            <FormattedMessage
                id='FindBoardsDialog.IntroText'
                defaultMessage='Search for boards'
            />
        </h4>
    </div>
)

export const EmptyResults = (props: {query: string}) => (
    <div className='noResults'>
        <div className='iconWrapper'>
            <Search/>
        </div>
        <h4 className='text-heading4'>
            <FormattedMessage
                id='FindBoardsDialog.NoResultsFor'
                defaultMessage='No results for "{searchQuery}"'
                values={{
                    searchQuery: props.query,
                }}
            />
        </h4>
        <span>
            <FormattedMessage
                id='FindBoardsDialog.NoResultsSubtext'
                defaultMessage='Check the spelling or try another search.'
            />
        </span>
    </div>
)

const SearchDialog = (props: Props): JSX.Element => {
    const [results, setResults] = useState<Array<ReactNode>>(props.initialData || [])
    const [isSearching, setIsSearching] = useState<boolean>(false)
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [selected, setSelected] = useState<number>(-1)

    const searchHandler = async (query: string): Promise<void> => {
        setIsSearching(true)
        setSelected(-1)
        setSearchQuery(query)
        const searchResults = await props.searchHandler(query)
        setResults(searchResults)
        setIsSearching(false)
    }

    const debouncedSearchHandler = useMemo(() => debounce(searchHandler, 200), [])

    const emptyResult = results.length === 0 && !isSearching && searchQuery

    const handleUpDownKeyPress = (e: KeyboardEvent) => {
        if (Utils.isKeyPressed(e, Constants.keyCodes.DOWN)) {
            e.preventDefault()
            if (results.length > 0)
                setSelected(((selected + 1) < results.length) ? (selected + 1) : selected)
        }

        if (Utils.isKeyPressed(e, Constants.keyCodes.UP)) {
            e.preventDefault()
            if (results.length > 0)
                setSelected(((selected - 1) > -1) ? (selected - 1) : selected)
        }
    }

    const handleEnterKeyPress = (e: KeyboardEvent) => {
        if (Utils.isKeyPressed(e, Constants.keyCodes.ENTER) && selected >= 0) {
            e.preventDefault()
            props.refs.current[selected].current.click()
        }
    }

    useEffect(() => {
        if (selected >= 0)
            props.refs.current[selected].current.parentElement.focus()

        document.addEventListener('keydown', handleUpDownKeyPress)
        document.addEventListener('keydown', handleEnterKeyPress)

        // cleanup function
        return () => {
            document.removeEventListener('keydown', handleUpDownKeyPress)
            document.removeEventListener('keydown', handleEnterKeyPress)
        }
    }, [selected, results])

    return (
        <Dialog
            className='BoardSwitcherDialog'
            onClose={props.onClose}
        >
            <div className='BoardSwitcherDialogBody'>
                <div className='head'>
                    <h3 className='text-heading4'>{props.title}</h3>
                    <h5>{props.subTitle}</h5>
                    <div className='queryWrapper'>
                        <Search/>
                        <input
                            className='searchQuery'
                            placeholder='Search for boards'
                            type='text'
                            onChange={(e) => debouncedSearchHandler(e.target.value)}
                            autoFocus={true}
                            maxLength={100}
                        />
                    </div>
                </div>
                <div className='searchResults'>
                    {/*When there are results to show*/}
                    {searchQuery && results.length > 0 &&
                        results.map((result) => (
                            <div
                                key={Utils.uuid()}
                                className='searchResult'
                                tabIndex={-1}
                            >
                                {result}
                            </div>
                        ))
                    }

                    {/*when user searched for something and there were no results*/}
                    {emptyResult && <EmptyResults query={searchQuery}/>}

                    {/*default state, when user didn't search for anything. This is the initial screen*/}
                    {!emptyResult && !searchQuery && <EmptySearch/>}
                </div>
            </div>
        </Dialog>
    )
}

export default SearchDialog
