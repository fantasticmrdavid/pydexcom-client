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
  Grid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { FaMicrophone } from 'react-icons/fa'
import Markdown from 'markdown-to-jsx'
import './styles.css'

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

const DEFAULT_LOCATION = 'Ballan,AU'

const trendDirectionIcons: { [key: string]: string } = {
  rising: '↑',
  dropping: '↓',
  Stable: '→',
  Increasing: '↗',
  Decreasing: '↘',
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
    signal: AbortSignal.timeout(30 * 1000),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || 'An error occurred')
  }
  return res.json()
}

export default function Assistant() {
  const [data, setData] = useState<ResponseData | null>(null)
  const [prompt, setPrompt] = useState('')
  const [location] = useState(DEFAULT_LOCATION)
  const [fullPrompt, setFullPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!isLoading && data) {
      setFullPrompt(data.fullPrompt)
    }
  }, [data])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetchResponse(prompt, location)
      setData(res)
    } catch (error) {
      setError(error as Error)
    }
    setIsLoading(false)
  }

  const handleSpeechToTextSubmit = async () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const speechResult = event.results[0][0].transcript
      setPrompt(speechResult)
      setIsLoading(true)
      try {
        const res = await fetchResponse(speechResult, location)
        setData(res)
      } catch (error) {
        setError(error as Error)
      }
      setIsLoading(false)
    }

    recognition.onerror = (event: Event) => {
      console.error('Speech recognition error', event)
    }

    recognition.start()
  }

  const { responseJson } = data ? data : {}

  return (
    <>
      <Head>
        <title>🦾 Betabot</title>
      </Head>
      <Container fluid className={'p-4 md:p-8'}>
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
            <Grid templateColumns="75% 1fr" gap={2}>
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
              <Button
                colorScheme="blue"
                onClick={handleSpeechToTextSubmit}
                disabled={isLoading}
                className={'w-full'}
              >
                <FaMicrophone />
              </Button>
            </Grid>
          </Box>
        </form>
        {error && (
          <Alert.Root status="error" mt={4}>
            <Alert.Indicator />
            <Alert.Title>{error.message}</Alert.Title>
          </Alert.Root>
        )}
        {data && responseJson && !isLoading && (
          <>
            <Card.Root my={4} className={'bg-[rgba(97,225,66,0.3)]'}>
              <Card.Body gap="2">
                <Card.Title fontSize={'x-large'}>
                  🩸 Recommended Action
                </Card.Title>
                <Box>
                  <HStack mt="4" align={'start'}>
                    <Text fontSize={'lg'} fontWeight="semibold">
                      Current BGL:
                    </Text>
                    <Text fontSize={'lg'} color="fg.muted">
                      {responseJson.finalRecommendation.currentBGL.replace(
                        'mmol/L',
                        '',
                      )}
                      {
                        trendDirectionIcons[
                          responseJson.finalRecommendation.trendDirection
                        ]
                      }
                    </Text>
                  </HStack>
                  <HStack mt="4" align={'start'}>
                    <Text fontSize={'lg'} fontWeight="semibold">
                      Pre-Bolus:
                    </Text>
                    <Text fontSize={'lg'} color="fg.muted">
                      {responseJson.finalRecommendation.preBolus}
                    </Text>
                  </HStack>
                  <HStack mt="4" align={'start'}>
                    <Text fontSize={'lg'} fontWeight="semibold">
                      Extended Bolus:
                    </Text>
                    <Text fontSize={'lg'} color="fg.muted">
                      {responseJson.finalRecommendation.extendedBolus}
                    </Text>
                  </HStack>
                </Box>
              </Card.Body>
              <Card.Footer />
            </Card.Root>
            <Card.Root my={4} className={'bg-white'}>
              <Card.Body gap="2">
                <Card.Title>💉 Dosage Breakdown</Card.Title>
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
              </Card.Body>
              <Card.Footer />
            </Card.Root>
            <Card.Root my={4} className={'bg-white'}>
              <Card.Body gap="2">
                <Card.Title>🗒️ Notes</Card.Title>
                <Box className={'my-4'}>
                  <Text color="fg.muted">
                    <Markdown>{responseJson.notes}</Markdown>
                  </Text>
                </Box>
              </Card.Body>
              <Card.Footer />
            </Card.Root>
            <Card.Root my={4} className={'bg-white'}>
              <Card.Body gap="2">
                <Card.Title>✏️ Full Prompt</Card.Title>
                <Box fontSize="sm">
                  <code>{fullPrompt}</code>
                </Box>
              </Card.Body>
            </Card.Root>
          </>
        )}
      </Container>
    </>
  )
}
