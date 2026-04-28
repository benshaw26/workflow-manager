import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SocialSchedulerClient } from './SocialSchedulerClient'

export default async function SocialSchedulerPage() {
  const session = await getServerSession(authOptions)
  return <SocialSchedulerClient userName={session?.user?.name ?? 'there'} />
}
