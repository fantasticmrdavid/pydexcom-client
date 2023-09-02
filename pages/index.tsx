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

const displayClassNames = classNames({
    [styles.display]: true,
    [styles.display4]: reading.mmol_l < 10,
    [styles.display5]: reading.mmol_l >= 10,
})

  return (
    <div className={counterClassNames}>
      <FlapDisplay
        className={displayClassNames}
        chars={Presets.ALPHANUM + ".↗↘→↓↑⇈⇊"}
        value={`${parseFloat(reading.mmol_l).toFixed(1)}${reading.trend_arrow}`}
        length={reading.mmol_l >= 10 ? 5 : 4}
        padMode={"start"}
      />
    </div>
  )
}
