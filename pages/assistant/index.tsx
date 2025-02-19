import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Textarea,
  Alert,
  Card,
  Container,
  HStack,
  Stack,
  Text,
  Center,
} from '@chakra-ui/react'
import Markdown from 'markdown-to-jsx'
import { useQuery } from '@tanstack/react-query'
import './styles.css'

const DEFAULT_LOCATION = 'Ballan,AU'

interface ResponseData {
  message: string
  fullPrompt: string
  readingsContext: string
  weatherContext: string
  responseJson: {
    finalRecommendation: {
      preBolus: string
      extendedBolus: string
    }
    dosageBreakdown: {
      step: string
      detail: string
    }[]
    notes: string
  }
}

async function fetchResponse(
  prompt: string,
  location: string,
): Promise<ResponseData> {
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, location }),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || 'An error occurred')
  }
  return res.json()
}

export default function Assistant() {
  const [prompt, setPrompt] = useState('')
  const [location] = useState(DEFAULT_LOCATION)
  const [fullPrompt, setFullPrompt] = useState('')

  const { data, error, isLoading, refetch } = useQuery<ResponseData, Error>({
    queryKey: ['fetchResponse', { prompt, location }],
    queryFn: () => fetchResponse(prompt, location),
    enabled: false, // Disable automatic query execution
  })

  useEffect(() => {
    if (!isLoading && data) {
      setFullPrompt(data.fullPrompt)
    }
  }, [data])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    refetch()
  }

  return (
    <Container fluid className={'p-8'}>
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
          <Alert.Title>{error.message}</Alert.Title>
        </Alert.Root>
      )}
      {data && !isLoading && (
        <Center mt={4}>
          <Box mb={4}>
            <HStack align="start">
              <Card.Root width="640px">
                <Card.Body gap="2">
                  <Card.Title>Recommended Action</Card.Title>
                  <Card.Description>
                    <HStack mt="4" align={'start'}>
                      <Text fontWeight="semibold">Pre-Bolus</Text>
                      <Text color="fg.muted">
                        {data.responseJson.finalRecommendation.preBolus}
                      </Text>
                    </HStack>
                    <HStack mt="4" align={'start'}>
                      <Text fontWeight="semibold">Extended Bolus</Text>
                      <Text color="fg.muted">
                        {data.responseJson.finalRecommendation.extendedBolus}
                      </Text>
                    </HStack>
                  </Card.Description>
                </Card.Body>
                <Card.Footer />
              </Card.Root>
              <Card.Root width="320px">
                <Card.Body gap="2">
                  <Card.Title>Dosage Breakdown</Card.Title>
                  <Card.Description>
                    <Stack>
                      {data.responseJson.dosageBreakdown.map((item) => (
                        <HStack
                          align={'start'}
                          key={`dosageBreakdown_${item.step}`}
                          mt="4"
                        >
                          <Text fontWeight="semibold">{item.step}:</Text>
                          <Text color="fg.muted">{item.detail}:</Text>
                        </HStack>
                      ))}
                    </Stack>
                  </Card.Description>
                </Card.Body>
                <Card.Footer />
              </Card.Root>
            </HStack>
            <Card.Root width="640px">
              <Card.Body gap="2">
                <Card.Title>Notes</Card.Title>
                <Card.Description>
                  <Text color="fg.muted">{data.responseJson.notes}</Text>
                </Card.Description>
              </Card.Body>
              <Card.Footer />
            </Card.Root>
          </Box>
          {/*<Markdown>{data.message}</Markdown>*/}
          <h3 className="font-bold">Full Prompt:</h3>
          <Box>
            <code>
              <Markdown>{fullPrompt}</Markdown>
            </code>
          </Box>
        </Center>
      )}
    </Container>
  )
}
