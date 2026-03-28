/* eslint-disable  @typescript-eslint/no-explicit-any */
"use client";
import Papa from "papaparse";
import { useEffect, useRef, useState } from "react";
import { BitArray } from "./lib/BitArray";
import RoomCard from "./components/roomCard";
import { FaWhatsapp } from "react-icons/fa6";

interface CSVRow {
  com_cod: string;
  compre: string;
  course_no: string;
  course_title: string;
  credits: string;
  days_and_hours: string;
  instructor: string;
  midsem: string;
  room: string;
  sec: string;
}

export default function Home() {
  const [data, setData] = useState<CSVRow[]>();
  const [rooms, setRooms] = useState<Map<string, BitArray>>(
    new Map<string, BitArray>()
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [buildingFilter, setBuildingFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const date = new Date();
  const day = date.getDay() - 1;
  const hour = date.getHours() - 7; // starts at 8am

  // fetch csv and parse it
  useEffect(() => {
    const fetchCSV = async () => {
      Papa.parse("/timetable_fully_cleaned.csv", {
        header: true,
        download: true,
        complete: function (results) {
          console.log(results);
          const mappedData: CSVRow[] = results.data.map((row: any) => {
            const mappedRow: CSVRow = {
              com_cod: row["COM COD"],
              compre: row["COMPRE"],
              course_no: row["COURSE NO."],
              course_title: row["COURSE TITLE"],
              credits: row["CREDITS"],
              days_and_hours: row["DAYS & HOURS"],
              instructor: row["INSTRUCTOR"],
              midsem: row["MIDSEM"],
              room: row["ROOM"],
              sec: row["SEC"],
            };
            return mappedRow;
          });
          setData(mappedData);
        },
      });
    };

    fetchCSV();
  }, []);

  // check if a string is a day
  function isDay(str: string) {
    return str.length >= 1 && str.match(/[A-Z]+[a-z]+/i);
  }

  // helper: get day index from day string
  function dayIndex(day: string): number {
    if (day === "M") return 0;
    if (day === "T") return 1;
    if (day === "W") return 2;
    if (day === "Th") return 3;
    if (day === "F") return 4;
    if (day === "S") return 5;
    return -1;
  }

  // helper: set bits on a BitArray for given days and hours
  function setBits(bitArray: BitArray, days: string[], hours: number[]) {
    for (const hour of hours) {
      for (const day of days) {
        const idx = dayIndex(day);
        if (idx >= 0) bitArray.set(6 * idx + hour);
      }
    }
  }

  // Parse the ROOM field and return an array of { room, allowedDays } entries.
  // Formats:
  //   "5102"                        → single room, all days allowed
  //   "2203(F) 6160(T Th)"          → room 2203 only on F, room 6160 only on T and Th
  //   "5102(F) (T Th)"              → room 5102 only on F, second group has no room number (skip)
  function parseRoomField(
    roomField: string
  ): { room: string; allowedDays: string[] | null }[] {
    // Check if the room field contains parenthesised day annotations
    const multiRoomRegex = /(\w+)?\(([^)]+)\)/g;
    let match;
    const entries: { room: string; allowedDays: string[] | null }[] = [];


    while ((match = multiRoomRegex.exec(roomField)) !== null) {
      const roomNum = match[1]; // may be undefined if pattern is like "(T Th)"
      const dayStr = match[2]; // e.g. "F" or "T Th" or "M W"
      if (!roomNum) continue; // skip entries without a room number
      // Split the day string into individual day tokens, handling "Th"
      const dayTokens: string[] = [];
      const dayTokenRegex = /Th|[MTWFS]/g;
      let dm;
      while ((dm = dayTokenRegex.exec(dayStr)) !== null) {
        dayTokens.push(dm[0]);
      }
      entries.push({ room: roomNum, allowedDays: dayTokens });
    }

    if (entries.length === 0) {
      // No parenthesised annotations — single room, all days allowed
      return [{ room: roomField.trim(), allowedDays: null }];
    }

    return entries;
  }

  // Parse days_and_hours string into { days, hours }[] groups
  function parseDaysAndHours(
    daysAndHours: string
  ): { days: string[]; hours: number[] }[] {
    const regexp = /([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+(?:\s+\d+)*)/gm;

    const matches = daysAndHours.match(regexp);
    if (!matches) return [];

    return matches.map((m) => {
      const tokens = m.split(" ");
      const days = tokens.filter(isDay) as string[];
      const hours = tokens.filter((s) => !isDay(s)).map(Number);
      return { days, hours };
    });
  }

  // set bits for each room
  useEffect(() => {
    if (data) {
      const newRooms = new Map<string, BitArray>();
      for (let i = 0; i < data.length; i++) {
        const rawRoom = data[i].room;
        if (
          !rawRoom ||
          rawRoom === "" ||
          data[i].days_and_hours === "" ||
          data[i].days_and_hours === undefined
        )
          continue;

        const roomEntries = parseRoomField(rawRoom);
        const scheduleGroups = parseDaysAndHours(data[i].days_and_hours);

        for (const entry of roomEntries) {
          const roomKey = entry.room;
          if (!roomKey || roomKey === "") continue;

          if (!newRooms.has(roomKey)) {
            newRooms.set(roomKey, new BitArray(6 * (12)));
          }
          const bitArray = newRooms.get(roomKey)!;

          for (const group of scheduleGroups) {
            // If this room entry has allowed days, filter the schedule days
            const effectiveDays = entry.allowedDays
              ? group.days.filter((d) => entry.allowedDays!.includes(d as string))
              : group.days;

            if (effectiveDays.length > 0) {
              setBits(bitArray, effectiveDays, group.hours);
            }
          }
        }
      }
      setRooms(newRooms);
      console.log(newRooms);
    }
  }, [data]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center  py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div>
          <a target='_blank' className="my-2 hover:text-blue-500 transition-all" href="https://wa.me/918376820175"><p className="text-sm font-medium text-heading flex">send feedback<FaWhatsapp className="ml-0.5 text-green-500 cursor-pointer" size={ 18 } /></p></a>
          <h1 className="text-4xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            what room is free?
          </h1>
          <p> for the chitchats, study sessions, and everything in between</p>

          {/* To display the list of free rooms */ }
          <section>
            <form className="max-w my-6" onSubmit={ (e) => e.preventDefault() }>
              <label htmlFor="search" className="block mb-2.5 text-sm font-medium text-heading sr-only ">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <svg className="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg>
                </div>
                <input ref={ inputRef } type="search" id="search" className="block w-full p-3 ps-9 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" placeholder="Search" value={ searchQuery } onChange={ (e) => setSearchQuery(e.target.value) } />
                <button type="button" className="absolute end-1.5 bottom-1.5 text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded text-xs px-3 py-1.5 focus:outline-none">Search</button>
              </div>
            </form>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-4 my-4">
              <button onClick={ () => setBuildingFilter("") } className={ `px-3 py-1.5 text-white rounded-sm cursor-pointer ${buildingFilter === "" ? "bg-blue-900" : ""}` }>All</button>
              <button onClick={ () => setBuildingFilter("NAB") } className={ `px-3 py-1.5 text-white rounded-sm cursor-pointer ${buildingFilter === "NAB" ? "bg-blue-900" : ""}` }>NAB</button>
              <button onClick={ () => setBuildingFilter("IPC") } className={ `px-3 py-1.5 text-white rounded-sm cursor-pointer ${buildingFilter === "IPC" ? "bg-blue-900" : ""}` }>IPC</button>
              <button onClick={ () => setBuildingFilter("LTC") } className={ `px-3 py-1.5 text-white rounded-sm cursor-pointer ${buildingFilter === "LTC" ? "bg-blue-900" : ""}` }>LTC</button>
              <button onClick={ () => setBuildingFilter("FD-I") } className={ `px-3 py-1.5 text-white rounded-sm cursor-pointer ${buildingFilter === "FD-I" ? "bg-blue-900" : ""}` }>FD-I</button>
              <button onClick={ () => setBuildingFilter("FD-II") } className={ `px-3 py-1.5 text-white rounded-sm cursor-pointer ${buildingFilter === "FD-II" ? "bg-blue-900" : ""}` }>FD-II</button>
              <button onClick={ () => setBuildingFilter("FD-III") } className={ `px-3 py-1.5 text-white rounded-sm cursor-pointer ${buildingFilter === "FD-III" ? "bg-blue-900" : ""}` }>FD-III</button>
            </div>
          </section>

        </div>
        {/* Display current time */ }
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full my-8">
          <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Date</span>
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              { new Date().getDate().toString().padStart(2, '0') }/{ (new Date().getMonth() + 1).toString().padStart(2, '0') }/{ new Date().getFullYear() }
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Time</span>
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              { new Date().getHours().toString().padStart(2, '0') }:{ new Date().getMinutes().toString().padStart(2, '0') }
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Timetable Schedule</span>
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 text-center">
              { day == 0 ? "Monday" : day == 1 ? "Tuesday" : day == 2 ? "Wednesday" : day == 3 ? "Thursday" : day == 4 ? "Friday" : day == 5 ? "Saturday" : "Sunday" }<br /><span className="text-lg text-zinc-500 font-normal block sm:inline">Hour { hour }</span>
            </span>
          </div>
        </div>
        { day >= 0 && day <= 5 && hour >= 1 && hour <= 11 ? (<div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {/* Filter the rooms based on the building filter.
            If starts with 1, FD-I
            If starts with 2, FD-II
            If starts with 3, FD-III
            If starts with 6, NAB
            If starts with 5, LTC 
            If is 6113, 6114, 6115, 6116, 6117, 6118, IPC
            */}

            { rooms !== null && Array.from(rooms.entries())
              .filter(([room]) => {
                if (searchQuery && !room.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                if (!buildingFilter) return true;
                if (buildingFilter === "NAB") return room.startsWith("6");
                if (buildingFilter === "LTC") return room.startsWith("5");
                if (buildingFilter === "FD-I") return room.startsWith("1");
                if (buildingFilter === "FD-II") return room.startsWith("2");
                if (buildingFilter === "FD-III") return room.startsWith("3");
                if (buildingFilter === "IPC") return room === "6113" || room === "6114" || room === "6115" || room === "6116" || room === "6117" || room === "6118";
                return false;
              })
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([room, bitArray]) => (
                <RoomCard key={ room } room={ room } bitArray={ bitArray } />
              )) }
          </div>

        </div>) : (<div>
          <p>Go anywhere bro.</p>
        </div>) }
      </main >
    </div >
  );
}
