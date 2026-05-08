import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export interface AgentJob {
  id: string
  clientId: string
  contentType: string
  platform: string
  payload: unknown
  status: 'queued' | 'processing' | 'done' | 'error'
  createdAt: string
}

const QUEUE_FILE = path.join(process.cwd(), 'data', 'agent-queue.json')

async function readQueue(): Promise<AgentJob[]> {
  try {
    const raw = await fs.readFile(QUEUE_FILE, 'utf8')
    return JSON.parse(raw) as AgentJob[]
  } catch {
    return []
  }
}

export async function addJob(params: {
  clientId: string
  contentType: string
  platform: string
  payload: unknown
}): Promise<AgentJob> {
  const job: AgentJob = {
    id: randomUUID(),
    ...params,
    status: 'queued',
    createdAt: new Date().toISOString(),
  }
  const jobs = await readQueue()
  jobs.push(job)
  await fs.mkdir(path.dirname(QUEUE_FILE), { recursive: true })
  await fs.writeFile(QUEUE_FILE, JSON.stringify(jobs.slice(-200), null, 2))
  return job
}
