import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ArrowBoldLeft from '@/components/icons/arrow-bold-left'
import File2 from '@/components/icons/file-2'
import Envelope2 from '@/components/icons/envelope-2'
import Download2 from '@/components/icons/download-2'
import CircleCheck from '@/components/icons/circle-check'
import { format } from 'date-fns'
import { getEmailDetailsFromParsed, markEmailAsRead } from '@/app/actions/primary'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { CustomInboundIcon } from '@/components/icons/customInbound'
import { EmailAttachments } from '@/components/email-attachments'

interface PageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    read?: string
  }>
}



export default async function EmailViewPage({ params, searchParams }: PageProps) {
  const { id: emailId } = await params
  const { read: readEmailId } = await searchParams
  
  // Get session on server
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    redirect('/login')
  }

  // Handle read parameter - mark email as read if specified
  if (readEmailId) {
    try {
      console.log('Marking email as read on server:', readEmailId)
      await markEmailAsRead(readEmailId)
      console.log('Successfully marked email as read:', readEmailId)
    } catch (error) {
      console.error('Failed to mark email as read:', readEmailId, error)
    }
  }

  // Fetch email details on server using the new parsed email action
  const emailResult = await getEmailDetailsFromParsed(emailId)
  
  if (emailResult.error) {
    return (
      <div className="p-4 font-outfit">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/mail">
              <Button variant="primary">
                <ArrowBoldLeft className="h-4 w-4 mr-2" />
                Back to Mail
              </Button>
            </Link>
          </div>

          <Card className="border-destructive/50 bg-destructive/10 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-destructive">
                <Envelope2 className="h-4 w-4" />
                <span>{emailResult.error}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const emailDetails = emailResult.data!

  // Mark email as read synchronously
  try {
    await markEmailAsRead(emailId)
    console.log('Email marked as read:', emailId)
  } catch (error) {
    console.error('Failed to mark email as read:', emailId, error)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Use parsed data when available, fallback to original data
  const displayFrom = emailDetails.parsedData.fromData?.text || emailDetails.from
  const displaySubject = emailDetails.subject

  // Extract initials for avatar
  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/)
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
    } else {
      return name.slice(0, 2).toUpperCase()
    }
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', 
      '#f59e0b', '#ef4444', '#ec4899', '#84cc16'
    ]
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    return colors[Math.abs(hash) % colors.length]
  }

  const senderName = emailDetails.parsedData.fromData?.addresses?.[0]?.name || displayFrom.split('<')[0].trim() || displayFrom.split('@')[0]
  const initials = getInitials(senderName)
  const avatarColor = getAvatarColor(senderName)

  return (
    <div className="p-4 font-outfit">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/mail">
            <Button variant="primary">
              <ArrowBoldLeft className="h-4 w-4 mr-2" />
              Back to Mail
            </Button>
          </Link>
        </div>

        {/* Email Content Card */}
        <Card className="rounded-xl overflow-hidden">
          <CardContent className="p-6">
            {/* Email Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">{displaySubject}</h1>

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <CustomInboundIcon 
                    text={initials}
                    size={40} 
                    backgroundColor={avatarColor} 
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {senderName}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        &lt;{emailDetails.parsedData.fromData?.addresses?.[0]?.address || (displayFrom.includes('<') ? displayFrom.split('<')[1].replace('>', '') : displayFrom)}&gt;
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      to {emailDetails.recipient}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {format(
                      emailDetails.parsedData.emailDate 
                        ? new Date(emailDetails.parsedData.emailDate) 
                        : emailDetails.receivedAt 
                          ? new Date(emailDetails.receivedAt) 
                          : new Date(), 
                      'MMM d, yyyy, h:mm a'
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {emailDetails.isRead && (
                      <Badge className="bg-emerald-500 text-white rounded-full px-2.5 py-0.5 text-xs font-medium shadow-sm pointer-events-none">
                        <CircleCheck className="w-3 h-3 mr-1" />
                        Read
                      </Badge>
                    )}
                    {emailDetails.parsedData.hasAttachments && (
                      <Badge className="bg-blue-500 text-white rounded-full px-2.5 py-0.5 text-xs font-medium shadow-sm pointer-events-none">
                        <File2 className="w-3 h-3 mr-1" />
                        {emailDetails.parsedData.attachmentCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className="border-t border-border pt-6">
              {emailDetails.emailContent.htmlBody ? (
                <div 
                  className="prose prose-sm max-w-none rounded-lg new-thing"
                  style={{ 
                    fontFamily: 'Inter, system-ui, sans-serif',
                    textAlign: 'left'
                  }}
                  dangerouslySetInnerHTML={{ __html: emailDetails.emailContent.htmlBody }}
                />
              ) : emailDetails.emailContent.textBody ? (
                <div 
                  className="whitespace-pre-wrap text-foreground leading-relaxed"
                  style={{ 
                    fontFamily: 'Inter, system-ui, sans-serif',
                    textAlign: 'left'
                  }}
                >
                  {emailDetails.emailContent.textBody}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CustomInboundIcon 
                    text="EM"
                    size={32} 
                    backgroundColor="#6b7280" 
                    className="mx-auto mb-2"
                  />
                  <p>No email content available</p>
                </div>
              )}
            </div>

            {/* Attachments */}
            <EmailAttachments 
              emailId={emailDetails.id} 
              attachments={emailDetails.emailContent.attachments || []} 
            />

            {/* Debug Info (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 pt-6 border-t border-border">
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium">Debug Info</summary>
                  <div className="mt-2 space-y-2">
                    <div><strong>Parse Success:</strong> {emailDetails.parsedData.parseSuccess ? 'Yes' : 'No'}</div>
                    {emailDetails.parsedData.parseError && (
                      <div><strong>Parse Error:</strong> {emailDetails.parsedData.parseError}</div>
                    )}
                    <div><strong>Message ID:</strong> {emailDetails.messageId}</div>
                    <div><strong>Has Text Body:</strong> {emailDetails.parsedData.hasTextBody ? 'Yes' : 'No'}</div>
                    <div><strong>Has HTML Body:</strong> {emailDetails.parsedData.hasHtmlBody ? 'Yes' : 'No'}</div>
                  </div>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 