import { Producer } from 'kafkajs'
import { kafka, kafkaEnabled } from './client.js'
import { logger } from '../utils/logger.js'

let producer: Producer | null = null

export async function connectProducer(): Promise<void> {
  if (!kafkaEnabled) {
    logger.info('Kafka disabled — skipping producer connection')
    return
  }

  producer = kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000,
  })

  await producer.connect()
  logger.info('Kafka producer connected')
}

export async function disconnectProducer(): Promise<void> {
  if (producer) {
    await producer.disconnect()
    producer = null
    logger.info('Kafka producer disconnected')
  }
}

export function getProducer(): Producer | null {
  return producer
}

export async function sendToTopic(
  topic: string,
  messages: Array<{ key?: string; value: string }>
): Promise<void> {
  if (!producer) {
    logger.warn('Kafka producer not available, message dropped')
    return
  }

  await producer.send({
    topic,
    messages,
  })
}
