import React from 'react'
import {
  Alert,
  Card,
  List,
  HStack,
  Stack,
  Box,
  Text,
  Button,
} from '@chakra-ui/react'
import Markdown from 'markdown-to-jsx'
import { Tooltip } from '@/components/ui/tooltip'
import { FaClipboard } from 'react-icons/fa'

interface ResponseData {
  message: string
  fullPrompt: string
  readingsContext: string
  weatherContext: string
  responseJson: {
    answer?: {
      summary: string
      keyPoints: string[]
    }
    finalRecommendation?: {
      fastCarbs?: string
      slowCarbs?: string
      preBolus: string
      extendedBolus: string
      currentBGL: string
      trendDirection: string
    }
    dosageBreakdown?: { step: string; detail: string }[]
    carbBreakdown?: { step: string; detail: string }[]
    notes: string
  }
}

const trendDirectionIcons: Record<string, string> = {
  rising: '↑',
  dropping: '↓',
  stable: '→',
  increasing: '↗',
  decreasing: '↘',
  'rapidly rising': '⇈',
  'rapidly dropping': '⇊',
}

interface Props {
  data: ResponseData | null
  isLoading: boolean
  error: Error | null
  onCopyPrompt: () => void
}

export function Responses({ data, isLoading, error, onCopyPrompt }: Props) {
  const responseJson = data?.responseJson

  return (
    <>
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
                <Card.Title fontSize="x-large">💬 Answer</Card.Title>
                <Text fontSize="lg" color="fg.muted">
                  {responseJson.answer.summary}
                </Text>
                <List.Root>
                  {responseJson.answer.keyPoints.map((kp, i) => (
                    <List.Item key={i} mt={4} color="fg.muted">
                      <Markdown>{kp}</Markdown>
                    </List.Item>
                  ))}
                </List.Root>
              </Card.Body>
            </Card.Root>
          )}

          {responseJson.finalRecommendation && (
            <Card.Root my={4} className={'bg-[rgba(97,225,66,0.3)]'}>
              <Card.Body gap="2">
                <Card.Title fontSize="x-large">
                  🩸 Recommended Action
                </Card.Title>
                <Box>
                  <HStack mt="4" align="start">
                    <Text fontWeight="semibold">Current BGL:</Text>
                    <Text color="fg.muted">
                      {responseJson.finalRecommendation.currentBGL}
                      {
                        trendDirectionIcons[
                          responseJson.finalRecommendation.trendDirection.toLowerCase()
                        ]
                      }
                    </Text>
                  </HStack>

                  <HStack mt="4" align="start">
                    <Text fontWeight="semibold">Pre-Bolus:</Text>
                    <Text color="fg.muted">
                      {responseJson.finalRecommendation.preBolus}
                    </Text>
                  </HStack>

                  <HStack mt="4" align="start">
                    <Text fontWeight="semibold">Extended Bolus:</Text>
                    <Text color="fg.muted">
                      {responseJson.finalRecommendation.extendedBolus}
                    </Text>
                  </HStack>

                  {responseJson.finalRecommendation.fastCarbs && (
                    <HStack mt="4" align="start">
                      <Text fontWeight="semibold">Fast Carbs:</Text>
                      <Text color="fg.muted">
                        {responseJson.finalRecommendation.fastCarbs}
                      </Text>
                    </HStack>
                  )}

                  {responseJson.finalRecommendation.slowCarbs && (
                    <HStack mt="4" align="start">
                      <Text fontWeight="semibold">Slow Carbs:</Text>
                      <Text color="fg.muted">
                        {responseJson.finalRecommendation.slowCarbs}
                      </Text>
                    </HStack>
                  )}
                </Box>
              </Card.Body>
            </Card.Root>
          )}

          {responseJson.dosageBreakdown && (
            <Card.Root my={4} className="bg-white">
              <Card.Body gap="2">
                <Card.Title>💉 Dosage Breakdown</Card.Title>
                <Stack>
                  {responseJson.dosageBreakdown.map((item) => (
                    <HStack key={item.step} mt="4" align="start">
                      <Text fontWeight="semibold" whiteSpace="nowrap">
                        {item.step}:
                      </Text>
                      <Text color="fg.muted">
                        <Markdown>{item.detail}</Markdown>
                      </Text>
                    </HStack>
                  ))}
                </Stack>
              </Card.Body>
            </Card.Root>
          )}

          {responseJson.carbBreakdown && (
            <Card.Root my={4} className="bg-white">
              <Card.Body gap="2">
                <Card.Title>🍔 Carb Breakdown</Card.Title>
                <Stack>
                  {responseJson.carbBreakdown.map((item) => (
                    <HStack key={item.step} mt="4" align="start">
                      <Text fontWeight="semibold">{item.step}:</Text>
                      <Text color="fg.muted">
                        <Markdown>{item.detail}</Markdown>
                      </Text>
                    </HStack>
                  ))}
                </Stack>
              </Card.Body>
            </Card.Root>
          )}

          <Card.Root my={4} className="bg-white">
            <Card.Body gap="2">
              <Card.Title>🗒️ Notes</Card.Title>
              <Box my={4}>
                <Text color="fg.muted">
                  <Markdown>{responseJson.notes}</Markdown>
                </Text>
              </Box>
            </Card.Body>
          </Card.Root>

          <Card.Root my={4} className="bg-white">
            <Card.Body gap="2">
              <Card.Title>
                ✏️ Full Prompt
                <Tooltip content="Copy to clipboard">
                  <Button ml={2} onClick={onCopyPrompt}>
                    <FaClipboard />
                  </Button>
                </Tooltip>
              </Card.Title>
              <Box fontSize="sm">
                <code>{data.fullPrompt}</code>
              </Box>
            </Card.Body>
          </Card.Root>
        </>
      )}
    </>
  )
}
