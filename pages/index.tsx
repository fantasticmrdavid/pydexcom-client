import { useQuery } from '@tanstack/react-query'
import styles from "./styles.module.scss"

export default function Home() {
  const { data: reading, isLoading } = useQuery(
    ['getReadings'],
    async () =>
      await fetch(`/api/reading`).then((res) =>
        res.json(),
      ),
  )

  if(isLoading || !reading) return <div>loading...</div>

  return (
    <div className={styles.container}>
      <div>{reading.mmol_l} {reading.trend_arrow}</div>
    </div>
  )
}
