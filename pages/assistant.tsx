import React, { useState } from 'react'
import {
  Box,
  Button,
  Textarea,
  Spinner,
  Alert,
  Container,
} from '@chakra-ui/react'

const DEFAULT_LOCATION = 'Ballan,AU'

export default function Assistant() {
  const [prompt, setPrompt] = useState('')
  const [location] = useState(DEFAULT_LOCATION)
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
    <Container fluid>
      <form onSubmit={handleSubmit}>
        <Box mb={4}>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here"
            width={'100%'}
            required
          />
        </Box>
        <Button type="submit" colorScheme="teal">
          Submit
        </Button>
      </form>
      {isLoading && <Spinner mt={4} />}
      {error && (
        <Alert.Root status="error" mt={4}>
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      )}
      {response && (
        <Box mt={4}>
          <h3>Response:</h3>
          <pre>{response.message}</pre>
          <h3>Full Prompt:</h3>
          <pre>{fullPrompt}</pre>
        </Box>
      )}
    </Container>
  )
}
