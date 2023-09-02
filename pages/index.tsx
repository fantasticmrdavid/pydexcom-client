import { useQuery } from '@tanstack/react-query'
import classNames from "classnames"
import { FlapDisplay, Presets } from 'react-split-flap-effect'
import styles from "./styles.module.scss"
import {useEffect, useState} from "react";

export default function Home() {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, setTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 1000);
        return () => {
            clearInterval(interval);
        };
    }, []);

  const { data: reading, isLoading } = useQuery(
    ['getReadings'],
    async () =>
      await fetch(`/api/reading`).then((res) =>
        res.json(),
      ),
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
        value={`${reading.mmol_l}${reading.trend_arrow}`}
        length={5}
        padMode={"start"}
      />
    </div>
  )
}
