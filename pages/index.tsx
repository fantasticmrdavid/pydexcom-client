import { useQuery } from '@tanstack/react-query'
import classNames from "classnames"
import { FlapDisplay, Presets } from 'react-split-flap-effect'
import styles from "./styles.module.scss"

export default function Home() {
  const { data: reading, isLoading } = useQuery(
    ['getReadings'],
    async () =>
      await fetch(`/api/reading`).then((res) =>
        res.json(),
      ),
      {
          refetchInterval: 6000,
      }
  )

  if(isLoading || !reading) return <div>loading...</div>

  const counterClassNames = classNames({
    [styles.container]: true,
  })

  return (
    <div className={counterClassNames}>
      <FlapDisplay
        className={styles.display}
        chars={Presets.ALPHANUM + ".↗↘→↓↑⇈⇊"}
        value={`${parseFloat(reading.mmol_l).toFixed(1)}${reading.trend_arrow}`}
        length={5}
        padMode={"start"}
      />
    </div>
  )
}
