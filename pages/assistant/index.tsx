import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import {
  Box,
  Button,
  Textarea,
  Alert,
  Center,
  Card,
  Container,
  HStack,
  Stack,
  Text,
} from '@chakra-ui/react'
import Markdown from 'markdown-to-jsx'
import { useQuery } from '@tanstack/react-query'
import './styles.css'

const DEFAULT_LOCATION = 'Ballan,AU'

const trendDirectionIcons: { [key: string]: string } = {
  rising: '↑',
  dropping: '↓',
  Stable: '→',
  upward: '↗',
  downward: '↘',
  'rapidly rising': '⇈',
  'rapidly dropping': '⇊',
}

interface ResponseData {
  message: string
  fullPrompt: string
  readingsContext: string
  weatherContext: string
  responseJson: {
    finalRecommendation: {
      preBolus: string
      extendedBolus: string
      currentBGL: string
      trendDirection: string
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

  const { responseJson } = data ? data : {}

  return (
    <>
      <Head>
        <title>🦾 Betabot</title>
      </Head>
      <Container fluid className={'p-8'}>
        <Center className={'my-4'}>
          <h1 className={'text-[36px] font-bold'}>🦾 Betabot</h1>
        </Center>
        <form onSubmit={handleSubmit}>
          <Box mb={4}>
            <Textarea
              className={'bg-white'}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here (eg. I want to eat half a ham and cheese toastie and then walk the dog)"
              rows={4}
              required
              onInvalid={(e) =>
                (e.target as HTMLTextAreaElement).setCustomValidity(
                  'Please enter a prompt.',
                )
              }
              onInput={(e) =>
                (e.target as HTMLTextAreaElement).setCustomValidity('')
              }
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
              className={'w-full'}
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
        {responseJson && !isLoading && (
          <>
            <Card.Root my={4} className={'bg-[rgba(97,225,66,0.3)]'}>
              <Card.Body gap="2">
                <Card.Title fontSize={'x-large'}>
                  🩸 Recommended Action (
                  {
                    trendDirectionIcons[
                      responseJson.finalRecommendation.trendDirection
                    ]
                  }
                  {responseJson.finalRecommendation.currentBGL})
                </Card.Title>
                <Card.Description>
                  <HStack mt="4" align={'start'}>
                    <Text fontSize={'lg'} fontWeight="semibold">
                      Pre-Bolus
                    </Text>
                    <Text fontSize={'lg'} color="fg.muted">
                      {responseJson.finalRecommendation.preBolus}
                    </Text>
                  </HStack>
                  <HStack mt="4" align={'start'}>
                    <Text fontSize={'lg'} fontWeight="semibold">
                      Extended Bolus
                    </Text>
                    <Text fontSize={'lg'} color="fg.muted">
                      {responseJson.finalRecommendation.extendedBolus}
                    </Text>
                  </HStack>
                </Card.Description>
              </Card.Body>
              <Card.Footer />
            </Card.Root>
            <Card.Root my={4} className={'bg-white'}>
              <Card.Body gap="2">
                <Card.Title>💉 Dosage Breakdown</Card.Title>
                <Card.Description>
                  <Stack>
                    {responseJson.dosageBreakdown.map((item) => (
                      <HStack
                        align={'start'}
                        key={`dosageBreakdown_${item.step}`}
                        mt="4"
                      >
                        <Text fontWeight="semibold">{item.step}:</Text>
                        <Text color="fg.muted">
                          <Markdown>{item.detail}</Markdown>
                        </Text>
                      </HStack>
                    ))}
                  </Stack>
                </Card.Description>
              </Card.Body>
              <Card.Footer />
            </Card.Root>
            <Card.Root my={4} className={'bg-white'}>
              <Card.Body gap="2">
                <Card.Title>🗒️ Notes</Card.Title>
                <Card.Description>
                  <Text color="fg.muted">{responseJson.notes}</Text>
                </Card.Description>
              </Card.Body>
              <Card.Footer />
            </Card.Root>
            <Card.Root my={4} className={'bg-white'}>
              <Card.Body gap="2">
                <Card.Title>✏️ Full Prompt</Card.Title>
                <Card.Description fontSize="sm">
                  <code>
                    <Markdown>{fullPrompt}</Markdown>
                  </code>
                </Card.Description>
              </Card.Body>
            </Card.Root>
          </>
        )}
      </Container>
    </>
  )
}
