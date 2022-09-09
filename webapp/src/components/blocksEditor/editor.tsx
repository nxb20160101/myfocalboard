import React, {useState, useEffect} from 'react'

import * as contentBlocks from './blocks/'
import {ContentType, BlockData} from './blocks/types'
import RootInput from './rootInput'

import './editor.scss'

type Props = {
    onSave: (block: BlockData) => Promise<BlockData|null>
    id?: string
    initialValue?: string
    initialContentType?: string
}

export default function Editor(props: Props) {
    const [value, setValue] = useState(props.initialValue || '')
    const [currentBlockType, setCurrentBlockType] = useState<ContentType|null>(contentBlocks.get(props.initialContentType || '') || null)

    useEffect(() => {
        if (!currentBlockType) {
            const block = contentBlocks.getByPrefix(value)
            if (block) {
                setValue('')
                setCurrentBlockType(block)
            } else if (value !== '' && !contentBlocks.isSubPrefix(value) && !value.startsWith('/')) {
                setCurrentBlockType(contentBlocks.get('text'))
            }
        }
    }, [value, currentBlockType])

    const CurrentBlockInput = currentBlockType?.Input

    return (
        <div className='Editor'>
            {currentBlockType === null &&
                <RootInput
                    onChange={setValue}
                    onChangeType={setCurrentBlockType}
                    value={value}
                    onSave={(val: string, blockType: string) => {
                        if (blockType === null && val === '') {
                            return
                        }
                        props.onSave({value: val, contentType: blockType, id: props.id})
                        setValue('')
                        setCurrentBlockType(null)
                    }}
                />}
            {CurrentBlockInput &&
                <CurrentBlockInput
                    onChange={setValue}
                    value={value}
                    onCancel={() => {
                        console.log("cancelling")
                        setValue('')
                        setCurrentBlockType(null)
                    }}
                    onSave={(val: string) => {
                        props.onSave({value: val, contentType: currentBlockType.name, id: props.id})
                        const nextType = contentBlocks.get(currentBlockType.nextType || '')
                        setValue('')
                        setCurrentBlockType(nextType || null)
                    }}
                />}
        </div>
    )
}