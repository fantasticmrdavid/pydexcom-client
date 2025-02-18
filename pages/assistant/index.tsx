import React, { useState } from 'react'
import { Box, Button, Textarea, Alert, Container } from '@chakra-ui/react'
import Markdown from 'markdown-to-jsx'
import './styles.css'

const DEFAULT_LOCATION = 'Ballan,AU'

interface ResponseData {
  message: string
  readingsContext: string
  weatherContext: string
}

export default function Assistant() {
  const [prompt, setPrompt] = useState('')
  const [location] = useState(DEFAULT_LOCATION)
  const [response, setResponse] = useState<ResponseData | null>(null)
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
        setFullPrompt(data.fullPrompt)
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
            rows={4}
            required
          />
        </Box>
        <Box textAlign="right">
          <Button
            type="submit"
            colorScheme="teal"
            loading={isLoading}
            spinnerPlacement="start"
            loadingText="Thinking..."
            disabled={isLoading}
          >
            Submit
          </Button>
        </Box>
      </form>
      {error && (
        <Alert.Root status="error" mt={4}>
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      )}
      {response && (
        <Box mt={4}>
          <Box mb={4}>
            <Markdown>{response.message}</Markdown>
          </Box>
          <h3 className="font-bold">Full Prompt:</h3>
          <Box>
            <code>
              <Markdown>{fullPrompt}</Markdown>
            </code>
          </Box>
        </Box>
      )}
    </Container>
  )
}
