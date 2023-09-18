import React from 'react'
import { Chart } from 'react-google-charts'

export const ReadingsChart = ({ data }) => {
  const options = {
    curveType: 'function',
    backgroundColor: 'transparent',
    lineWidth: 4,
    colors: ['#000'],
    hAxis: {
      gridlines: {
        count: 0,
      },
    },
    vAxis: {
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
      height="250px"
      data={data}
      options={options}
    />
  )
}
