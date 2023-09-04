import { useQuery } from '@tanstack/react-query'
import classNames from "classnames"
import styles from "./styles.module.scss"

export default function Home() {
  const { data, isLoading } = useQuery(
    ['getReadings'],
    async () =>
      await fetch(`/api/reading`).then((res) =>
        res.json(),
      ),
      {
          refetchInterval: 6000,
      }
  )

  if(isLoading || !data) return <div className={styles.container}>loading...</div>

    const {reading} = data

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
          {parseFloat(reading.mmol_l).toFixed(1)}{reading.trend_arrow}
      </div>
    </div>
  )
}
