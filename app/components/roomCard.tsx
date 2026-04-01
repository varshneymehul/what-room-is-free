import React from 'react'
import { BitArray } from '../lib/BitArray'
type Props = {
  room: string,
  bitArray: BitArray,
  dayFilter: number,
  hourFilter: number
}

const roomCard = (props: Props) => {
  // const date = new Date();
  // const day = date.getDay() - 1;
  // const hour = date.getHours() - 7; // starts at 8am

  return (
    <div className="bg-zinc-100 dark:bg-gray-900 rounded-md p-2 border border-zinc-200 dark:border-zinc-800">
      <p className="text-2xl text-zinc-900 dark:text-white font-bold">{ props.room }</p>
      <div>
        { !props.bitArray.isSet(props.dayFilter * 13 + props.hourFilter) ? (
          <p className="text-green-500">Free</p>
        ) : (
          <p className="text-red-500">Busy</p>
        ) }
      </div>
    </div>
  )
}

export default roomCard
