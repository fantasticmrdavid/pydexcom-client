import React from 'react'
import { Chart } from 'react-google-charts'

type ChartData = [string, string | number][]

type Props = {
  data: ChartData
}

export const ReadingsChart = ({ data }: Props) => {
  const options = {
    backgroundColor: 'transparent',
    lineWidth: 4,
    colors: ['#000'],
    hAxis: {
      gridlines: {
        count: 0,
      },
    },
    vAxis: {
      ticks: [3, 5, 7, 9, 11],
      viewWindow: {
        min: 2,
        max: 12,
      },
      gridlines: {
        color: '#000',
      },
    },
    pointSize: 10,
    legend: 'none',
    fontSize: 18,
    padding: 0,
    margin: 0,
  }

  return (
    <Chart
      chartType="LineChart"
      width="100%"
      height="300px"
      data={data}
      options={options}
    />
  )
}
