import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import {
  Box,
  Button,
  Textarea,
  Center,
  Container,
  Fieldset,
  HStack,
  Input,
  Grid,
  Text,
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
import { Responses } from '@/app/components/Assistant/Responses'

import { FaMicrophone } from 'react-icons/fa'
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

type LocationSource = 'device' | 'manual'

const DEFAULT_LOCATION = 'Ballan, VIC, AU'

const DEFAULT_PURPOSE: systemPromptOption = 'plannedActivity'

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
  actualBGL?: number,
  activeInsulinUnits?: number,
): Promise<ResponseData> {
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      location,
      purpose,
      userPersona,
      actualBGL,
      activeInsulinUnits,
    }),
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

  const [data, setData] = useState<ResponseData | null>(null)
  const [prompt, setPrompt] = useState('')
  const [purpose, setPurpose] =
    useState<keyof typeof systemPrompts>(DEFAULT_PURPOSE)

  const [locationMethod, setLocationMethod] = useState<LocationSource>('manual')
  const [manualLocation, setManualLocation] = useState(DEFAULT_LOCATION)
  const [detectedLocation, setDetectedLocation] = useState('')
  const [detectedLocationName, setDetectedLocationName] = useState('')

  const [activeInsulinUnits, setActiveInsulinUnits] = useState<number>()
  const [actualBglReading, setActualBglReading] = useState<number>()

  const [fullPrompt, setFullPrompt] = useState('')
  const [userPersona] = useState<keyof typeof userPersonas>('patient')
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

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `/api/reverseGeocode?lat=${latitude}&lon=${longitude}`,
          )
          if (!res.ok) throw new Error('Reverse geocoding failed')
          const data = await res.json()
          if ('error' in data) throw new Error(data.error)

          const { city, state, country } = data
          const locationString = [city, state, country]
            .filter(Boolean)
            .join(', ')
          setDetectedLocation(`${latitude},${longitude}`)
          setDetectedLocationName(locationString)
        } catch (err) {
          console.error('Reverse geocoding error', err)
          setDetectedLocation(`${latitude},${longitude}`)
        }
      },
      (err) => console.error('Geo error', err),
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    const loc = locationMethod === 'device' ? detectedLocation : manualLocation

    try {
      const res = await fetchResponse(
        prompt,
        loc,
        purpose,
        userPersona,
        actualBglReading || undefined,
        activeInsulinUnits || undefined,
      )
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

    const loc = locationMethod === 'device' ? detectedLocation : manualLocation

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const speechResult = event.results[0][0].transcript
      setPrompt(speechResult)
      setIsLoading(true)
      try {
        const res = await fetchResponse(
          speechResult,
          loc,
          purpose,
          userPersona,
          actualBglReading || undefined,
          activeInsulinUnits || undefined,
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
            <SelectRoot
              collection={purposeOptions}
              onValueChange={(option) =>
                setPurpose(option.value[0] as systemPromptOption)
              }
              defaultValue={[purpose]}
            >
              <SelectLabel>
                <strong>I want to:</strong>
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
            <Fieldset.Root>
              <Fieldset.Legend>
                <strong>Current Location:</strong>
              </Fieldset.Legend>
              <RadioGroup
                value={locationMethod}
                onValueChange={({ value }) =>
                  setLocationMethod(value as LocationSource)
                }
              >
                <HStack gap="6">
                  <Radio value="device">Use Device</Radio>
                  <Radio value="manual">Enter Manually</Radio>
                </HStack>
              </RadioGroup>
              {locationMethod === 'device' ? (
                <Button mt={2} onClick={handleDetectLocation}>
                  Detect Location
                </Button>
              ) : (
                <Input
                  mt={2}
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  placeholder="City,Country or lat,lng"
                />
              )}
              {locationMethod === 'device' && detectedLocation && (
                <Text mt={2} fontSize="sm" color="fg.muted">
                  Detected: {detectedLocationName} ({detectedLocation})
                </Text>
              )}
            </Fieldset.Root>
          </Box>
          <Box mb={4}>
            <Fieldset.Root>
              <Fieldset.Legend>
                <strong>Active insulin units:</strong>
              </Fieldset.Legend>
              <Input
                type="number"
                step="0.1"
                value={activeInsulinUnits ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  setActiveInsulinUnits(val ? parseFloat(val) : undefined)
                }}
                placeholder="e.g. 1.3"
              />
            </Fieldset.Root>
          </Box>
          <Box mb={4}>
            <Fieldset.Root>
              <Fieldset.Legend>
                <strong>Actual BGL (mmol) from blood test:</strong>
              </Fieldset.Legend>
              <Input
                type="number"
                step="0.1"
                value={actualBglReading ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  setActualBglReading(val ? parseFloat(val) : undefined)
                }}
                placeholder="e.g. 5.5"
              />
            </Fieldset.Root>
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
        <Responses
          data={data}
          isLoading={isLoading}
          error={error}
          onCopyPrompt={handleCopyToClipboard}
        />
      </Container>
    </>
  )
}
