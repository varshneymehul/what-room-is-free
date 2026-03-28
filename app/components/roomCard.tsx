import React from 'react'
import { BitArray } from '../lib/BitArray'
type Props = {
  room: string,
  bitArray: BitArray
}

const roomCard = (props: Props) => {
  const date = new Date();
  const day = date.getDay() - 1;
  const hour = date.getHours() - 7; // starts at 8am

  return (
    <div className="bg-gray-900 rounded-md p-2">
      <p className="text-2xl font-bold">{ props.room }</p>
      <div>
        { !props.bitArray.isSet(day * 6 + hour) ? (
          <p className="text-green-500">Free</p>
        ) : (
          <p className="text-red-500">Busy</p>
        ) }
      </div>
    </div>
  )
}

export default roomCard
