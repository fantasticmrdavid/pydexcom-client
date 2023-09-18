import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import classNames from 'classnames'
import styles from './styles.module.scss'
import React, { ReactNode, useEffect, useState } from 'react'
import {
  TbArrowDown,
  TbArrowDownRight,
  TbArrowRight,
  TbArrowsDown,
  TbArrowsUp,
  TbArrowUp,
  TbArrowUpRight,
} from 'react-icons/tb'
import { ReadingsChart } from '@/app/components/ReadingsChart/ReadingsChart'

export type Reading = {
  mmol_l: number
  last_cgm_reading: string
  trend_arrow: string
}

const OUTDATED_MINUTES = 5
dayjs.extend(relativeTime)

const arrowsToIcons: { [key: string]: ReactNode } = {
  '↑↑': <TbArrowsUp />,
  '↑': <TbArrowUp />,
  '↗': <TbArrowUpRight />,
  '→': <TbArrowRight />,
  '↘': <TbArrowDownRight />,
  '↓': <TbArrowDown />,
  '↓↓': <TbArrowsDown />,
}

export default function Home() {
  const [, setTime] = useState(new Date())
  const { data, isLoading } = useQuery(
    ['getReadings'],
    async () => await fetch(`/api/reading`).then((res) => res.json()),
    {
      refetchInterval: 6000,
    },
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const { readings } = data || {}

  if (isLoading || !data)
    return <div className={styles.container}>loading...</div>

  const current = readings[0]

  const lastUpdateMinutesAgo = dayjs().diff(
    dayjs(current.last_cgm_reading),
    'minutes',
  )

  const counterClassNames = classNames({
    [styles.container]: true,
    [styles.bg_green]: current.mmol_l > 4 && current.mmol_l < 10,
    [styles.bg_orange]: current.mmol_l >= 10,
    [styles.bg_purple]: current.mmol_l <= 4,
    [styles.bg_outdated]: lastUpdateMinutesAgo > OUTDATED_MINUTES,
  })

  const displayClassNames = classNames({
    [styles.display]: true,
    [styles.display4]: current.mmol_l < 10,
    [styles.display5]: current.mmol_l >= 10,
  })

  return (
    <div className={counterClassNames}>
      <div className={displayClassNames}>
        {parseFloat(current.mmol_l).toFixed(1)}
        {arrowsToIcons[current.trend_arrow] || current.trend_arrow}
      </div>
      <div>
        <div className={styles.chart}>
          <ReadingsChart
            data={[
              ['i', 'v'],
              ...readings
                .toReversed()
                .map((r: Reading) => [
                  dayjs(r.last_cgm_reading).format('H:mm'),
                  r.mmol_l,
                ]),
            ]}
          />
        </div>
        <div className={styles.updated}>
          Updated {dayjs(current.last_cgm_reading).from(dayjs())}
        </div>
      </div>
    </div>
  )
}
