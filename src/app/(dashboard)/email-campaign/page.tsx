import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EmailCampaignClient } from './EmailCampaignClient'

export default async function EmailCampaignPage() {
  const session = await getServerSession(authOptions)
  return <EmailCampaignClient userName={session?.user?.name ?? 'there'} />
}
