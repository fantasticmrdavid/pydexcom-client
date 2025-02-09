import React, { useState } from 'react'
import styles from './styles.module.scss'

export default function Assistant() {
  const [prompt, setPrompt] = useState('')
  const [location, setLocation] = useState('')
  const [response, setResponse] = useState(null)
  const [fullPrompt, setFullPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setResponse(null)
    setFullPrompt('')
    setError(null)

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, location }),
      })
      const data = await res.json()
      if (res.ok) {
        setResponse(data)
        setFullPrompt(
          `${prompt}\n\nContext:\n${data.readingsContext}\n\n${data.weatherContext}`,
        )
      } else {
        setError(data.message || 'An error occurred')
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError('Error fetching data: ' + error.message)
      } else {
        setError('An unknown error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit}>
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here"
            className={styles.textarea}
            required
          />
        </div>
        <div>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter your location"
            className={styles.input}
            required
          />
        </div>
        <div>
          <button type="submit" className={styles.button}>
            Submit
          </button>
        </div>
      </form>
      {isLoading && <div>Loading...</div>}
      {error && <div className={styles.error}>{error}</div>}
      {response && (
        <div>
          <h3>Response:</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
          <h3>Full Prompt:</h3>
          <pre>{fullPrompt}</pre>
        </div>
      )}
    </div>
  )
}
