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
  Fieldset,
  HStack,
  Grid,
  Stack,
  Text,
  List,
  createListCollection,
} from '@chakra-ui/react'
import { Radio, RadioGroup } from '@/components/ui/radio'
import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from '@/components/ui/select'
import { Tooltip } from '@/components/ui/tooltip'

import { FaClipboard, FaMicrophone } from 'react-icons/fa'
import Markdown from 'markdown-to-jsx'
import './styles.css'
import { systemPrompts } from '@/pages/api/ask/systemPrompts'
import { userPersonas } from '@/pages/api/ask/userPersonas'

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

type systemPromptOption = keyof typeof systemPrompts

const DEFAULT_LOCATION = 'Ballan,AU'

const DEFAULT_PURPOSE: systemPromptOption = 'plannedActivity'

const trendDirectionIcons: { [key: string]: string } = {
  rising: '↑',
  dropping: '↓',
  stable: '→',
  increasing: '↗',
  decreasing: '↘',
  'rapidly rising': '⇈',
  'rapidly dropping': '⇊',
}

interface ResponseData {
  message: string
  fullPrompt: string
  readingsContext: string
  weatherContext: string
  responseJson: {
    answer: {
      summary: string
      keyPoints: string[]
    }
    finalRecommendation: {
      fastCarbs?: string
      slowCarbs?: string
      preBolus: string
      extendedBolus: string
      currentBGL: string
      trendDirection: string
    }
    dosageBreakdown?: {
      step: string
      detail: string
    }[]
    carbBreakdown?: {
      step: string
      detail: string
    }[]
    notes: string
  }
}

async function fetchResponse(
  prompt: string,
  location: string,
  purpose: string,
  userPersona: string,
): Promise<ResponseData> {
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, location, purpose, userPersona }),
    signal: AbortSignal.timeout(30 * 1000),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || 'An error occurred')
  }
  return res.json()
}

export default function Assistant() {
  const purposeOptions = createListCollection({
    items: Object.keys(systemPrompts).map((key) => ({
      value: key,
      label: systemPrompts[key as keyof typeof systemPrompts].label,
    })),
  })

  const userPersonaOptions = Object.keys(userPersonas).map((key) => ({
    value: key,
    label: userPersonas[key as keyof typeof userPersonas].label,
  }))

  const [data, setData] = useState<ResponseData | null>(null)
  const [prompt, setPrompt] = useState('')
  const [purpose, setPurpose] =
    useState<keyof typeof systemPrompts>(DEFAULT_PURPOSE)
  const [location] = useState(DEFAULT_LOCATION)
  const [fullPrompt, setFullPrompt] = useState('')
  const [userPersona, setUserPersona] =
    useState<keyof typeof userPersonas>('carer')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasSpeechRecognitionApi, setHasSpeechRecognitionApi] = useState(false)

  useEffect(() => {
    if (!isLoading && data) {
      setFullPrompt(data.fullPrompt)
    }
  }, [data, isLoading])

  useEffect(() => {
    setHasSpeechRecognitionApi(
      typeof window !== 'undefined' &&
        !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    )
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetchResponse(prompt, location, purpose, userPersona)
      setError(null)
      setData(res)
    } catch (error) {
      setError(error as Error)
    }
    setIsLoading(false)
  }

  const handleSpeechToTextSubmit = async () => {
    const recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-au'

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const speechResult = event.results[0][0].transcript
      setPrompt(speechResult)
      setIsLoading(true)
      try {
        const res = await fetchResponse(
          speechResult,
          location,
          purpose,
          userPersona,
        )
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

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(fullPrompt).catch((err) => {
      console.error('Failed to copy: ', err)
    })
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
            <Fieldset.Root>
              <Fieldset.Legend>
                <strong>I am a person who:</strong>
              </Fieldset.Legend>
              <RadioGroup
                value={userPersona}
                onValueChange={(e) => {
                  setUserPersona(e.value as keyof typeof userPersonas)
                }}
              >
                <HStack gap="6">
                  {userPersonaOptions.map((option) => (
                    <Radio key={option.value} value={option.value}>
                      {option.label}
                    </Radio>
                  ))}
                </HStack>
              </RadioGroup>
            </Fieldset.Root>
          </Box>
          <Box mb={4}>
            <SelectRoot
              collection={purposeOptions}
              onValueChange={(option) =>
                setPurpose(option.value[0] as systemPromptOption)
              }
              defaultValue={[purpose]}
            >
              <SelectLabel>
                <strong>And I want to:</strong>
              </SelectLabel>
              <SelectTrigger>
                <SelectValueText placeholder={'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {purposeOptions.items.map((promptOption) => (
                  <SelectItem item={promptOption} key={promptOption.value}>
                    {promptOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </Box>
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
              {hasSpeechRecognitionApi && (
                <Button
                  colorScheme="blue"
                  onClick={handleSpeechToTextSubmit}
                  onTouchStart={handleSpeechToTextSubmit}
                  disabled={isLoading}
                  className={'w-full'}
                >
                  <FaMicrophone />
                </Button>
              )}
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
            {responseJson.answer && (
              <Card.Root my={4} className={'bg-[rgba(97,225,66,0.3)]'}>
                <Card.Body gap="2">
                  <Card.Title fontSize={'x-large'}>💬 Answer</Card.Title>
                  <Box>
                    <Text fontSize={'lg'} color="fg.muted">
                      {responseJson.answer.summary}
                    </Text>
                  </Box>
                  <List.Root>
                    {responseJson.answer.keyPoints.map((item, index) => (
                      <List.Item
                        mt={4}
                        color="fg.muted"
                        key={`answer_keypoint_${index.toString()}`}
                      >
                        <Markdown>{item}</Markdown>
                      </List.Item>
                    ))}
                  </List.Root>
                </Card.Body>
                <Card.Footer />
              </Card.Root>
            )}
            {responseJson.finalRecommendation && (
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
                        {responseJson.finalRecommendation.currentBGL}
                        {
                          trendDirectionIcons[
                            responseJson.finalRecommendation.trendDirection.toLowerCase()
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
                    {responseJson.finalRecommendation.fastCarbs && (
                      <HStack mt="4" align={'start'}>
                        <Text fontSize={'lg'} fontWeight="semibold">
                          Fast Carbs:
                        </Text>
                        <Text fontSize={'lg'} color="fg.muted">
                          {responseJson.finalRecommendation.fastCarbs}
                        </Text>
                      </HStack>
                    )}
                    {responseJson.finalRecommendation.slowCarbs && (
                      <HStack mt="4" align={'start'}>
                        <Text fontSize={'lg'} fontWeight="semibold">
                          Slow Carbs:
                        </Text>
                        <Text fontSize={'lg'} color="fg.muted">
                          {responseJson.finalRecommendation.slowCarbs}
                        </Text>
                      </HStack>
                    )}
                  </Box>
                </Card.Body>
                <Card.Footer />
              </Card.Root>
            )}
            {responseJson.dosageBreakdown && (
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
            )}
            {responseJson.carbBreakdown && (
              <Card.Root my={4} className={'bg-white'}>
                <Card.Body gap="2">
                  <Card.Title>🍔 Carb Breakdown</Card.Title>
                  <Stack>
                    {responseJson.carbBreakdown.map((item) => (
                      <HStack
                        align={'start'}
                        key={`carbBreakdown_${item.step}`}
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
            )}
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
                <Card.Title>
                  ✏️ Full Prompt{' '}
                  <Tooltip content={'Copy to clipboard'}>
                    <Button onClick={handleCopyToClipboard} ml={2}>
                      <FaClipboard />
                    </Button>
                  </Tooltip>
                </Card.Title>
                <Box fontSize="sm" display="flex" alignItems="flex-start">
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
