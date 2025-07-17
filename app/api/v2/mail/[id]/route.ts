import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/auth'
import { getEmail } from '@/functions/mail/primary'
import { validateRequest } from '../../helper/main'


// GET /api/v2/mail/[id] types
export interface GetMailByIdParams {
    id: string
}

export interface ParsedEmailAddress {
    text: string
    addresses: Array<{
        name: string | null
        address: string | null
    }>
}

export interface EmailAttachment {
    filename: string | undefined
    contentType: string | undefined
    size: number | undefined
    contentId: string | undefined
    contentDisposition: string | undefined
}

export interface GetMailByIdResponse {
    id: string
    emailId: string
    messageId: string | null
    subject: string | null
    from: string
    fromName: string | null
    to: string
    cc: string | null
    bcc: string | null
    replyTo: string | null
    recipient: string
    receivedAt: Date | null
    isRead: boolean
    readAt: Date | null
    
    content: {
        textBody: string | null
        htmlBody: string | null
        rawContent: string | null
        attachments: EmailAttachment[]
        headers: Record<string, any>
    }
    
    addresses: {
        from: ParsedEmailAddress | null
        to: ParsedEmailAddress | null
        cc: ParsedEmailAddress | null
        bcc: ParsedEmailAddress | null
        replyTo: ParsedEmailAddress | null
    }
    
    metadata: {
        inReplyTo: string | null
        references: string[]
        priority: string | null
        parseSuccess: boolean | null
        parseError: string | null
        hasAttachments: boolean
        attachmentCount: number
        hasTextBody: boolean
        hasHtmlBody: boolean
    }
    
    security: {
        spf: string
        dkim: string
        dmarc: string
        spam: string
        virus: string
    }
    
    processing: {
        processingTimeMs: number | null
        timestamp: Date | null
        receiptTimestamp: Date | null
        actionType: string | null
        s3Info: {
            bucketName: string | null
            objectKey: string | null
            contentFetched: boolean | null
            contentSize: number | null
            error: string | null
        }
        commonHeaders: Record<string, any> | null
    }
    
    createdAt: Date | null
    updatedAt: Date | null
}

/**
 * GET /api/v2/mail/[id]
 * Gets a single email by id (returns the entire email object)
 * Supports both session-based auth and API key auth
 * Has tests? ✅
 * Has logging? ✅
 * Has types? ✅
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    console.log('📧 GET /api/v2/mail/[id] - Starting request')
    
    try {
        // Get session (handles both regular sessions and API key sessions)
        console.log('🔐 Validating request authentication')
        const { userId, error } = await validateRequest(request)
        if (!userId) {
            console.log('❌ Authentication failed:', error)
            return NextResponse.json(
                { error: error },
                { status: 401 }
            )
        }
        console.log('✅ Authentication successful for userId:', userId)
        
        const { id } = await params
        console.log('📨 Requested email ID:', id)

        // Validate email ID
        if (!id || typeof id !== 'string') {
            console.log('⚠️ Invalid email ID provided:', id)
            return NextResponse.json(
                { error: 'Valid email ID is required' },
                { status: 400 }
            )
        }

        // Call the function with userId
        console.log('🔍 Calling getEmail function for userId:', userId, 'emailId:', id)
        const result = await getEmail(userId, id)

        if (result.error) {
            if (result.error === 'Email not found') {
                console.log('📭 Email not found for user:', userId, 'emailId:', id)
                return NextResponse.json(
                    { error: 'Email not found' },
                    { status: 404 }
                )
            }
            console.log('💥 getEmail returned error:', result.error)
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        console.log('✅ Successfully retrieved email for user:', userId, 'emailId:', id)
        return NextResponse.json(result.data)

    } catch (error) {
        console.error('💥 Unexpected error in GET /api/v2/mail/[id]:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 