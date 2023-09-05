import { useMutation, useQuery } from '@tanstack/react-query'
import classNames from 'classnames'
import styles from './styles.module.scss'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Home() {
  const [lastFetch, setLastFetch] = useState()
  const { data, isLoading } = useQuery(
    ['getReadings'],
    async () => await fetch(`/api/reading`).then((res) => res.json()),
    {
      refetchInterval: 6000,
    },
  )

  const { reading } = data || {}

  const addReading = useMutation({
    mutationFn: () =>
      axios.post('/api/reading', {
        mmol_l: reading.mmol_l,
        trend_arrow: reading.trend_arrow,
        trend_description: reading.trend_description,
        datetime: new Date(reading.datetime).toISOString(),
      }),
    onSuccess: () => {
      setLastFetch(reading.datetime)
    },
    onError: (error) => {
      console.log('ERROR: ', error)
    },
  })

  useEffect(() => {
    if (data && reading.datetime !== lastFetch) addReading.mutate()
  }, [])

  if (isLoading || !data)
    return <div className={styles.container}>loading...</div>

  const counterClassNames = classNames({
    [styles.container]: true,
    [styles.bg_green]: reading.mmol_l > 4 && reading.mmol_l < 10,
    [styles.bg_orange]: reading.mmol_l >= 10,
    [styles.bg_purple]: reading.mmol_l <= 4,
  })

  const displayClassNames = classNames({
    [styles.display]: true,
    [styles.display4]: reading.mmol_l < 10,
    [styles.display5]: reading.mmol_l >= 10,
  })

  return (
    <div className={counterClassNames}>
      <div className={displayClassNames}>
        {parseFloat(reading.mmol_l).toFixed(1)}
        {reading.trend_arrow}
      </div>
    </div>
  )
}
