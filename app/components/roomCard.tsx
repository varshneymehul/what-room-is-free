"use client";
import React, { useState, useEffect } from 'react'
import { BitArray } from '../lib/BitArray'
type Props = {
  room: string,
  bitArray: BitArray,
  dayFilter: number,
  hourFilter: number
}
const hourToTimeString = (hour: number) => {
  if (hour === -1) {
    return "";
  }
  switch (hour) {
    case 1:
      return "8am";
    case 2:
      return "9am";
    case 3:
      return "10am";
    case 4:
      return "11am";
    case 5:
      return "12pm";
    case 6:
      return "1pm";
    case 7:
      return "2pm";
    case 8:
      return "3pm";
    case 9:
      return "4pm";
    case 10:
      return "5pm";
    case 11:
      return "6pm";
    case 12:
      return "7pm";
    case 13:
      return "8pm";
  }
}
const roomCard = (props: Props) => {
  // const date = new Date();
  // const day = date.getDay() - 1;
  // const hour = date.getHours() - 7; // starts at 8am

  const [freeUntil, setFreeUntil] = useState<number>(-1);

  useEffect(() => {
    let nextFree = props.bitArray.nextSet(props.dayFilter * 13 + props.hourFilter);
    if (nextFree > (props.dayFilter + 1) * 13 - 1) {
      nextFree = 100;
    }
    setFreeUntil(nextFree);
  }, [props.bitArray, props.dayFilter, props.hourFilter]);

  const getFreeUntilString = () => {
    if (freeUntil === -1) {
      return "";
    }
    const hour = freeUntil % 13;
    return `${hourToTimeString(hour)}`;
  }
  return (
    <div className="bg-zinc-100 dark:bg-gray-900 rounded-md p-2 border border-zinc-200 dark:border-zinc-800">
      <p className="text-2xl text-zinc-900 dark:text-white font-bold">{ props.room }</p>
      <div>
        { !props.bitArray.isSet(props.dayFilter * 13 + props.hourFilter) ? (
          <p className="text-green-500">Free <br />
            { freeUntil !== -1 && freeUntil !== 100 && <span className="text-xs text-green-700 dark:text-green-200">until { getFreeUntilString() }</span> }
            { freeUntil === 100 && <span className="text-xs text-green-700 dark:text-green-200">now onwards</span> }
          </p>

        ) : (
          <p className="text-red-500">Busy</p>
        ) }
      </div>
    </div>
  )
}

export default roomCard
