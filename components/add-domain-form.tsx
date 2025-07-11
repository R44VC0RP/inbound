"use client"

import type React from "react"

import { useState, useEffect, useMemo, type FormEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Globe2 from "@/components/icons/globe-2"
import CheckList from "@/components/icons/check-list"
import BadgeCheck2 from "@/components/icons/badge-check-2"
import CircleCheck from "@/components/icons/circle-check"
import ArrowBoldRight from "@/components/icons/arrow-bold-right"
import Clipboard2 from "@/components/icons/clipboard-2"
import Loader from "@/components/icons/loader"
import Refresh2 from "@/components/icons/refresh-2"
import Clock2 from "@/components/icons/clock-2"
import CircleWarning2 from "@/components/icons/circle-warning-2"
import ExternalLink2 from "@/components/icons/external-link-2"
import Download2 from "@/components/icons/download-2"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import ResendIcon from "@/components/ResendIcon"
import { Checkbox } from "@/components/ui/checkbox"

interface StepConfig {
  id: string
  name: string
  description?: string
  icon: React.ElementType
}

const stepsConfig: StepConfig[] = [
  { id: "01", name: "Domain", description: "Domain name for your sending.", icon: Globe2 },
  { id: "02", name: "DNS Records", description: "Add records to your DNS provider.", icon: CheckList },
  { id: "03", name: "Verified", description: "Your domain is ready.", icon: BadgeCheck2 },
]

const stepVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

interface DnsRecord {
  name: string
  type: "TXT" | "MX"
  value: string
  isVerified: boolean
}

interface ApiResponse {
  success: boolean
  domain: string
  domainId: string
  verificationToken: string
  status: 'pending' | 'verified' | 'failed'
  dnsRecords: DnsRecord[]
  error?: string
}

interface AddDomainFormProps {
  // Optional props for preloading existing domain data
  preloadedDomain?: string
  preloadedDomainId?: string
  preloadedDnsRecords?: DnsRecord[]
  preloadedStep?: number
  preloadedProvider?: string
  onRefresh?: () => void
  overrideRefreshFunction?: () => Promise<void>
  // Optional callback when domain is successfully added/verified
  onSuccess?: (domainId: string) => void
}

// Provider documentation mapping
const getProviderDocUrl = (provider: string): string | null => {
  const providerMap: Record<string, string> = {
    'route53': 'https://resend.com/docs/knowledge-base/route53',
    'amazon route 53': 'https://resend.com/docs/knowledge-base/route53',
    'aws': 'https://resend.com/docs/knowledge-base/route53',
    'cloudflare': 'https://resend.com/docs/knowledge-base/cloudflare',
    'namecheap': 'https://resend.com/docs/knowledge-base/namecheap',
    'vercel': 'https://resend.com/docs/knowledge-base/vercel',
    'squarespace': 'https://resend.com/docs/knowledge-base/squarespace',
    'hostzinger': 'https://resend.com/docs/knowledge-base/hostzinger',
    'ionos': 'https://resend.com/docs/knowledge-base/ionos',
    'gandi': 'https://resend.com/docs/knowledge-base/gandi',
    'porkbun': 'https://resend.com/docs/knowledge-base/porkbun'
  }

  const normalizedProvider = provider.toLowerCase().trim()
  return providerMap[normalizedProvider] || null
}

export default function AddDomainForm({
  preloadedDomain = "",
  preloadedDomainId = "",
  preloadedDnsRecords = [],
  preloadedStep = 0,
  preloadedProvider = "",
  onRefresh,
  overrideRefreshFunction,
  onSuccess
}: AddDomainFormProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(preloadedStep)
  const [domainName, setDomainName] = useState(preloadedDomain)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed' | null>(null)
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>(preloadedDnsRecords)
  const [domainId, setDomainId] = useState(preloadedDomainId)
  const [resendApiKey, setResendApiKey] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [showDomainSelection, setShowDomainSelection] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [resendDomains, setResendDomains] = useState<any[]>([])
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set())
  const [importProgress, setImportProgress] = useState<{
    [key: string]: {
      status: 'pending' | 'processing' | 'success' | 'failed' | 'exists'
      message?: string
      domainId?: string
    }
  }>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [periodicCheckEnabled, setPeriodicCheckEnabled] = useState(false)
  const [domainSuggestions, setDomainSuggestions] = useState<string[]>([])
  const [isCheckingSuggestions, setIsCheckingSuggestions] = useState(false)
  const router = useRouter()

  // Memoize the DNS records to prevent unnecessary re-renders
  const memoizedPreloadedDnsRecords = useMemo(() => preloadedDnsRecords, [
    JSON.stringify(preloadedDnsRecords)
  ])

  // Update state when props change (for when component is reused with different data)
  useEffect(() => {
    setCurrentStepIdx(preloadedStep)
    setDomainName(preloadedDomain)
    setDnsRecords(memoizedPreloadedDnsRecords)
    setDomainId(preloadedDomainId)
  }, [preloadedStep, preloadedDomain, memoizedPreloadedDnsRecords, preloadedDomainId])

  // Lazy refresh status when component loads with preloaded data (pending domain)
  useEffect(() => {
    if (preloadedDomainId && preloadedDomain && preloadedStep === 1) {
      // Add a small delay to let the component fully mount
      const timer = setTimeout(() => {
        console.log("🔄 Auto-refreshing domain verification status for:", preloadedDomain)
        handleRefresh()
        // Enable periodic checks after initial refresh
        setPeriodicCheckEnabled(true)
      }, 500) // 500ms delay

      return () => clearTimeout(timer)
    }
  }, [preloadedDomainId, preloadedDomain, preloadedStep])

  // Periodic verification check every 5 seconds
  useEffect(() => {
    if (!periodicCheckEnabled || !domainId || !domainName || verificationStatus === 'verified' || verificationStatus === 'failed') {
      return
    }

    console.log("🔄 Starting periodic verification checks every 5 seconds for:", domainName)

    const intervalId = setInterval(() => {
      console.log("⏰ Periodic verification check for:", domainName)
      handlePeriodicRefresh()
    }, 5000) // 5 seconds

    return () => {
      console.log("🛑 Stopping periodic verification checks for:", domainName)
      clearInterval(intervalId)
    }
  }, [periodicCheckEnabled, domainId, domainName, verificationStatus])

  // Handle periodic refresh (silent, no loading states)
  const handlePeriodicRefresh = async () => {
    if (!domainId || !domainName || isRefreshing) {
      return
    }

    try {
      const response = await fetch('/api/domain/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkVerification',
          domain: domainName,
          domainId: domainId
        })
      })

      const result: ApiResponse = await response.json()

      if (result.success) {
        // Update verification status
        setVerificationStatus(result.status)

        // Update DNS records if provided
        if (result.dnsRecords) {
          setDnsRecords(result.dnsRecords)
        }

        if (result.status === 'verified') {
          console.log("✅ Domain verified! Redirecting to domain details page...")
          toast.success("Domain verified successfully! Redirecting...")
          setPeriodicCheckEnabled(false) // Stop periodic checks
          
          // Redirect to domain details page
          setTimeout(() => {
            router.push(`/emails/${domainId}`)
          }, 1500) // Small delay to show the success message
        }
      }
    } catch (err) {
      console.error('Error in periodic verification check:', err)
      // Don't show error toast for periodic checks to avoid spamming
    }
  }

  const handleNext = () => {
    if (currentStepIdx === 0 && !domainName.trim()) {
      setError("Please enter a valid domain name.")
      return
    }
    if (currentStepIdx === 0 && domainName.trim()) {
      if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domainName)) {
        setError("Please enter a valid domain format (e.g., example.com).")
        return
      }
    }
    setError("")
    if (currentStepIdx < stepsConfig.length - 1) {
      setCurrentStepIdx((prev) => prev + 1)
    }
  }

  const generateSubdomainSuggestions = async (domain: string): Promise<string[]> => {
    const subdomainPrefixes = ['e', 'i', 'inbound', 'mail', 'receive']
    const suggestions: string[] = []
    
    setIsCheckingSuggestions(true)
    
    for (const prefix of subdomainPrefixes) {
      if (suggestions.length >= 3) break // Limit to 3 suggestions
      
      const subdomain = `${prefix}.${domain}`
      
      try {
        const checkResponse = await fetch('/api/domain/verifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'canDomainBeUsed',
            domain: subdomain
          })
        })

        const checkResult = await checkResponse.json()
        
        if (checkResult.success && checkResult.canBeUsed) {
          suggestions.push(subdomain)
        }
      } catch (error) {
        console.error(`Error checking subdomain ${subdomain}:`, error)
        // Continue to next suggestion
      }
    }
    
    setIsCheckingSuggestions(false)
    return suggestions
  }

  const handleSuggestionClick = (suggestion: string) => {
    setDomainName(suggestion)
    setDomainSuggestions([])
    setError("")
  }

  const handleSubmitDomain = async (e: FormEvent) => {
    e.preventDefault()
    if (!domainName.trim()) {
      setError("Please enter a valid domain name.")
      return
    }

    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domainName)) {
      setError("Please enter a valid domain format (e.g., example.com).")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // First check if domain can be used
      const checkResponse = await fetch('/api/domain/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'canDomainBeUsed',
          domain: domainName
        })
      })

      const checkResult = await checkResponse.json()

      if (!checkResult.success) {
        setError(checkResult.error || 'Failed to check domain')
        return
      }

      if (!checkResult.canBeUsed) {
        // Generate subdomain suggestions
        const suggestions = await generateSubdomainSuggestions(domainName)
        setDomainSuggestions(suggestions)
        
        if (suggestions.length > 0) {
          setError(`This domain cannot be used. It may have conflicting DNS records. Try one of these available alternatives:`)
        } else {
          setError('This domain cannot be used. It may have conflicting DNS records.')
        }
        return
      }

      // If domain can be used, add it
      const addResponse = await fetch('/api/domain/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addDomain',
          domain: domainName
        })
      })

      const addResult: ApiResponse = await addResponse.json()

      if (!addResult.success) {
        setError(addResult.error || 'Failed to add domain')
        return
      }

      console.log("addResult", addResult)

      // Success - move to next step
      setDnsRecords(addResult.dnsRecords)
      setDomainId(addResult.domainId)
      setVerificationStatus(addResult.status)
      setCurrentStepIdx(1)
      setDomainSuggestions([]) // Clear any suggestions

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(addResult.domainId)
      }

    } catch (err) {
      console.error('Error adding domain:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    // Use overrideRefreshFunction if provided, otherwise fall back to onRefresh or default behavior
    if (overrideRefreshFunction) {
      setIsRefreshing(true)
      try {
        await overrideRefreshFunction()
      } catch (err) {
        console.error('Error in override refresh function:', err)
        toast.error("Failed to refresh status")
      } finally {
        setIsRefreshing(false)
      }
      return
    }

    if (onRefresh) {
      onRefresh()
      return
    }

    if (!domainId) {
      toast.error("No domain ID available for verification")
      return
    }

    setIsRefreshing(true)
    setError("")

    console.log("🔄 Manual refresh for domainId:", domainId)

    try {
      const response = await fetch('/api/domain/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkVerification',
          domain: domainName,
          domainId: domainId
        })
      })

      const result: ApiResponse = await response.json()

      console.log("🔍 Manual refresh result:", result)

      if (!result.success) {
        setError(result.error || 'Failed to check verification status')
        toast.error("Failed to refresh status")
        setPeriodicCheckEnabled(false) // Stop periodic checks on error
        return
      }

      // Update verification status
      setVerificationStatus(result.status)

      if (result.status === 'verified') {
        console.log("✅ Domain verified via manual refresh! Redirecting...")
        toast.success("Domain verified successfully! Redirecting...")
        setPeriodicCheckEnabled(false) // Stop periodic checks
        
        // Redirect to domain details page
        setTimeout(() => {
          router.push(`/emails/${domainId}`)
        }, 1500) // Small delay to show the success message
      } else if (result.status === 'failed') {
        toast.error("Domain verification failed")
        setPeriodicCheckEnabled(false) // Stop periodic checks on failure
      } else {
        toast.info("Domain verification still pending")
        // Enable periodic checks if not already enabled
        if (!periodicCheckEnabled) {
          setPeriodicCheckEnabled(true)
        }
      }

      // Update DNS records if provided
      if (result.dnsRecords) {
        setDnsRecords(result.dnsRecords)
      }

    } catch (err) {
      console.error('Error checking verification:', err)
      setError('An unexpected error occurred while checking verification status.')
      toast.error("Failed to refresh status")
      setPeriodicCheckEnabled(false) // Stop periodic checks on error
    } finally {
      setIsRefreshing(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard")
    } catch (err) {
      console.error("Failed to copy text: ", err)
      toast.error("Failed to copy to clipboard")
    }
  }

  const downloadZoneFile = () => {
    if (!domainName || dnsRecords.length === 0) {
      toast.error("No DNS records available to download")
      return
    }

    try {
      // Generate zone file content
      const zoneFileContent = generateZoneFile(domainName, dnsRecords)
      
      // Create blob and download
      const blob = new Blob([zoneFileContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${domainName}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success("Zone file downloaded successfully")
    } catch (err) {
      console.error("Failed to generate zone file:", err)
      toast.error("Failed to generate zone file")
    }
  }

  const generateZoneFile = (domain: string, records: DnsRecord[]): string => {
    // Extract root domain (last two parts: domain.tld)
    const domainParts = domain.split('.')
    const rootDomain = domainParts.slice(-2).join('.')
    
    let zoneContent = `$ORIGIN ${rootDomain}.\n`
    zoneContent += `$TTL 3600\n\n`
    
    // Group records by type
    const txtRecords = records.filter(r => r.type === 'TXT')
    const mxRecords = records.filter(r => r.type === 'MX')
    
    // TXT Records
    if (txtRecords.length > 0) {
      zoneContent += `; TXT Records\n`
      txtRecords.forEach(record => {
        const recordName = extractRecordName(record.name, domain)
        const name = recordName === '@' ? '@' : recordName
        zoneContent += `${name}\t\t3600\tTXT\t"${record.value}"\n`
      })
      zoneContent += `\n`
    }
    
    // MX Records
    if (mxRecords.length > 0) {
      zoneContent += `; MX Records\n`
      mxRecords.forEach(record => {
        const recordName = extractRecordName(record.name, domain)
        const name = recordName === '@' ? '@' : recordName
        const [priority, mailServer] = record.value.split(' ')
        zoneContent += `${name}\t\t3600\tMX\t${priority}\t${mailServer}\n`
      })
      zoneContent += `\n`
    }
    
    return zoneContent
  }

  const handleResendImport = async () => {
    if (!resendApiKey.trim()) {
      toast.error("Please enter your Resend API key")
      return
    }

    if (!resendApiKey.startsWith('re_')) {
      toast.error("Invalid Resend API key format. It should start with 're_'")
      return
    }

    setIsImporting(true)
    setError("")

    try {
      // Fetch domains from Resend API via our server endpoint
      const response = await fetch('/api/resend/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: resendApiKey
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch domains from Resend')
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch domains from Resend')
      }

      if (data.domains && data.domains.length > 0) {
        toast.success(`Found ${data.domains.length} domain(s) in your Resend account`)

        // Set up domains for selection
        setResendDomains(data.domains)
        setSelectedDomains(new Set()) // Start with no domains selected

        // Show domain selection screen
        setShowDomainSelection(true)

        console.log('Resend domains:', data.domains)
      } else {
        toast.info("No domains found in your Resend account")
      }

      // Clear the API key for security
      setResendApiKey("")

    } catch (err) {
      console.error('Error importing from Resend:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to import domains from Resend. Please check your API key.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleSelectAll = () => {
    const allDomainNames = new Set(resendDomains.map(domain => domain.name))
    setSelectedDomains(allDomainNames)
  }

  const handleSelectNone = () => {
    setSelectedDomains(new Set())
  }

  const handleDomainToggle = (domainName: string) => {
    const newSelected = new Set(selectedDomains)
    if (newSelected.has(domainName)) {
      newSelected.delete(domainName)
    } else {
      newSelected.add(domainName)
    }
    setSelectedDomains(newSelected)
  }

  const startBulkImport = () => {
    if (selectedDomains.size === 0) {
      toast.error("Please select at least one domain to import")
      return
    }

    // Initialize progress tracking for selected domains only
    const initialProgress: { [key: string]: { status: 'pending', message?: string } } = {}
    selectedDomains.forEach((domainName) => {
      initialProgress[domainName] = { status: 'pending' }
    })
    setImportProgress(initialProgress)

    // Show bulk import screen and start processing
    setShowDomainSelection(false)
    setShowBulkImport(true)
    processBulkImport()
  }

  const processBulkImport = async () => {
    setIsProcessing(true)

    // Only process selected domains
    const selectedDomainObjects = resendDomains.filter(domain => selectedDomains.has(domain.name))

    for (const domain of selectedDomainObjects) {
      const domainName = domain.name

      // Update status to processing
      setImportProgress(prev => ({
        ...prev,
        [domainName]: { status: 'processing', message: 'Adding domain...' }
      }))

      try {
        // First check if domain can be used
        const checkResponse = await fetch('/api/domain/verifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'canDomainBeUsed',
            domain: domainName
          })
        })

        const checkResult = await checkResponse.json()

        if (!checkResult.success) {
          setImportProgress(prev => ({
            ...prev,
            [domainName]: {
              status: 'failed',
              message: checkResult.error || 'Failed to check domain compatibility'
            }
          }))
          continue
        }

        if (!checkResult.canBeUsed) {
          setImportProgress(prev => ({
            ...prev,
            [domainName]: {
              status: 'failed',
              message: 'Domain cannot be used. May have conflicting DNS records or MX records already configured.'
            }
          }))
          continue
        }

        // If domain can be used, add it
        const addResponse = await fetch('/api/domain/verifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'addDomain',
            domain: domainName
          })
        })

        const addResult = await addResponse.json()

        if (addResult.success) {
          setImportProgress(prev => ({
            ...prev,
            [domainName]: {
              status: 'success',
              message: `Successfully added. Status: ${addResult.status}`,
              domainId: addResult.domainId
            }
          }))
        } else {
          // Handle specific error cases
          let errorMessage = addResult.error || 'Failed to add domain'

          if (addResult.error?.includes('already exists')) {
            setImportProgress(prev => ({
              ...prev,
              [domainName]: {
                status: 'exists',
                message: 'Domain already exists in your account',
                domainId: addResult.domainId
              }
            }))
          } else if (addResult.error?.includes('limit reached')) {
            setImportProgress(prev => ({
              ...prev,
              [domainName]: {
                status: 'failed',
                message: 'Domain limit reached. Please upgrade your plan to add more domains.'
              }
            }))
            // Stop processing if limit reached
            break
          } else {
            setImportProgress(prev => ({
              ...prev,
              [domainName]: {
                status: 'failed',
                message: errorMessage
              }
            }))
          }
        }

      } catch (err) {
        console.error(`Error processing domain ${domainName}:`, err)
        setImportProgress(prev => ({
          ...prev,
          [domainName]: {
            status: 'failed',
            message: 'Network error occurred while adding domain'
          }
        }))
      }

      // Small delay between requests to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsProcessing(false)

    // Show completion summary
    const results = Object.values(importProgress)
    const successful = results.filter(r => r.status === 'success').length
    const existing = results.filter(r => r.status === 'exists').length
    const failed = results.filter(r => r.status === 'failed').length

    toast.success(`Import completed: ${successful} added, ${existing} already existed, ${failed} failed`)
  }

  const extractRecordName = (recordName: string, domainName: string) => {
    // Extract root domain from domainName (get last 2 parts: domain.tld)
    const domainParts = domainName.split('.')
    const rootDomain = domainParts.slice(-2).join('.')

    // If the record name is exactly the root domain, return "@"
    if (recordName === rootDomain) {
      return "@"
    }

    // If the record name ends with the root domain, extract the subdomain part
    if (recordName.endsWith(`.${rootDomain}`)) {
      return recordName.replace(`.${rootDomain}`, '')
    }

    // Fallback: if no match found, return the original record name
    return recordName
  }

  const isStepCompleted = (index: number) => index < currentStepIdx
  const isStepCurrent = (index: number) => index === currentStepIdx
  const isStepFuture = (index: number) => index > currentStepIdx

  return (
    <div className="flex flex-col">
      <div className="w-full max-w-4xl px-2  mx-auto">
        <header className="mb-8 flex items-center space-x-4">
          {/* <div className="rounded-lg bg-iconBg">
            <Image src="/domain-icon.png" alt="Logo" width={48} height={48} className="p-2" />
          </div> */}
          {/* <div>
            <h1 className="text-3xl font-semibold text-darkText">Add Domain</h1>
            <p className="text-base text-mediumText">Use a domain you own to send emails.</p>
          </div> */}
        </header>

        {/* Top Horizontal Stepper */}
        <div className="w-full mb-8">
          <nav className="flex items-center justify-center">
            {stepsConfig.map((step, index) => {
              const completed = isStepCompleted(index)
              const current = isStepCurrent(index)
              const future = isStepFuture(index)

              // Determine which icon to use based on step and state
              let iconSrc = ""
              if (index === 0) {
                iconSrc = "/domain-icon.png"
              } else if (index === 1) {
                iconSrc = completed || current ? "/dns-icon.png" : "/dns-icon-greyed.png"
              } else if (index === 2) {
                iconSrc = completed || current ? "/verified-icon.png" : "/verified-icon-greyed.png"
              }

              return (
                <div key={step.id} className="flex items-center">
                  <motion.div
                    className="flex h-10 w-10 items-center justify-center"
                    initial={{ scale: current ? 1.1 : 1 }}
                    animate={{ scale: current ? 1.1 : 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Image
                      src={iconSrc}
                      alt={step.name}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </motion.div>
                  {/* Arrow between steps */}
                  {index < stepsConfig.length - 1 && (
                    <div className="mx-8">
                      <ArrowBoldRight
                        className={cn("h-5 w-5 transition-colors duration-300", {
                          "text-brandPurple": completed,
                          "text-gray-400": !completed,
                        })}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="w-full max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIdx}
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3, type: "tween" }}
              className="pt-1"
            >
              {currentStepIdx > 0 && (
                <div className="mb-10 rounded-lg bg-green-50 p-5 border border-green-200">
                  <div className="flex items-center mb-1">
                    <h2 className="text-lg font-semibold text-gray-800">{stepsConfig[0].name}</h2>
                    <CircleCheck width="18" height="18" className="ml-2 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{stepsConfig[0].description}</p>
                  <div className="flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm">
                    {/* <Image src="/domain-icon.png" alt="Logo" width={16} height={16} /> */}
                    <span className="font-mono text-sm text-gray-700">{domainName}</span>
                  </div>
                </div>
              )}

              {showDomainSelection && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-darkText">Select Domains to Import</h2>
                      <p className="text-sm text-mediumText">
                        Choose which domains from your Resend account to import into Inbound
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowDomainSelection(false)
                        setResendDomains([])
                        setSelectedDomains(new Set())
                      }}
                    >
                      Cancel
                    </Button>
                  </div>

                  {/* Selection Controls */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSelectNone}
                      >
                        Select None
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedDomains.size} of {resendDomains.length} domains selected
                    </div>
                  </div>

                  {/* Domains Table */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    {/* Table Header */}
                    <div className="bg-muted/30 border-b border-border">
                      <div className="flex items-center text-sm font-medium text-muted-foreground px-4 py-3">
                        <div className="w-12"></div>
                        <div className="flex-1">Domain</div>
                        <div className="w-24">Status</div>
                        <div className="w-32">Created</div>
                      </div>
                    </div>

                    {/* Table Body */}
                    <div className="bg-white">
                      {resendDomains.map((domain, index) => (
                        <div
                          key={domain.id}
                          className={cn(
                            "flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer",
                            {
                              "border-b border-border/50": index < resendDomains.length - 1,
                              "bg-blue-50": selectedDomains.has(domain.name)
                            }
                          )}
                          onClick={() => handleDomainToggle(domain.name)}
                        >
                          <div className="w-12">
                            <Checkbox
                              checked={selectedDomains.has(domain.name)}
                              onCheckedChange={() => handleDomainToggle(domain.name)}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-mono text-sm font-medium">{domain.name}</div>
                            {domain.region && (
                              <div className="text-xs text-gray-500">Region: {domain.region}</div>
                            )}
                          </div>
                          <div className="w-24">
                            <span className={cn(
                              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                              {
                                "bg-green-100 text-green-800": domain.status === 'verified',
                                "bg-yellow-100 text-yellow-800": domain.status === 'pending',
                                "bg-red-100 text-red-800": domain.status === 'failed',
                                "bg-gray-100 text-gray-800": !domain.status
                              }
                            )}>
                              {domain.status || 'unknown'}
                            </span>
                          </div>
                          <div className="w-32 text-sm text-gray-600">
                            {domain.created_at ? new Date(domain.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Import Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={startBulkImport}
                      variant="primary"
                      disabled={selectedDomains.size === 0}
                      className="min-w-32"
                    >
                      Import {selectedDomains.size} Domain{selectedDomains.size !== 1 ? 's' : ''}
                    </Button>
                  </div>
                </div>
              )}

              {showBulkImport && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-darkText">Import Domains from Resend</h2>
                      <p className="text-sm text-mediumText">
                        Processing {selectedDomains.size} selected domain(s) from your Resend account
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowBulkImport(false)
                        setShowDomainSelection(true)
                      }}
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                  </div>

                  {/* Domain Processing List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {resendDomains.filter(domain => selectedDomains.has(domain.name)).map((domain, index) => {
                      const progress = importProgress[domain.name]
                      const status = progress?.status || 'pending'

                      return (
                        <div
                          key={domain.name}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-lg border",
                            {
                              "bg-gray-50 border-gray-200": status === 'pending',
                              "bg-blue-50 border-blue-200": status === 'processing',
                              "bg-green-50 border-green-200": status === 'success',
                              "bg-yellow-50 border-yellow-200": status === 'exists',
                              "bg-red-50 border-red-200": status === 'failed',
                            }
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border">
                              {status === 'pending' && (
                                <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                              )}
                              {status === 'processing' && (
                                <Loader width="16" height="16" className="animate-spin text-blue-600" />
                              )}
                              {status === 'success' && (
                                <CircleCheck width="16" height="16" className="text-green-600" />
                              )}
                              {status === 'exists' && (
                                <CircleCheck width="16" height="16" className="text-yellow-600" />
                              )}
                              {status === 'failed' && (
                                <CircleWarning2 width="16" height="16" className="text-red-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-mono text-sm font-medium">{domain.name}</div>
                              {domain.status && (
                                <div className="text-xs text-gray-500">
                                  Resend Status: {domain.status}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={cn(
                              "text-sm font-medium",
                              {
                                "text-gray-500": status === 'pending',
                                "text-blue-600": status === 'processing',
                                "text-green-600": status === 'success',
                                "text-yellow-600": status === 'exists',
                                "text-red-600": status === 'failed',
                              }
                            )}>
                              {status === 'pending' && 'Waiting...'}
                              {status === 'processing' && 'Processing...'}
                              {status === 'success' && 'Added Successfully'}
                              {status === 'exists' && 'Already Exists'}
                              {status === 'failed' && 'Failed'}
                            </div>
                            {progress?.message && (
                              <div className="text-xs text-gray-600 mt-1 max-w-xs">
                                {progress.message}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {!isProcessing && Object.keys(importProgress).length === 0 && (
                      <Button
                        onClick={processBulkImport}
                        variant="primary"
                        className="flex-1"
                      >
                        Start Import
                      </Button>
                    )}

                    {isProcessing && (
                      <Button
                        variant="primary"
                        className="flex-1"
                        disabled
                      >
                        <Loader width="16" height="16" className="mr-2 animate-spin" />
                        Processing Domains...
                      </Button>
                    )}

                    {!isProcessing && Object.keys(importProgress).length > 0 && (
                      <>
                        <Button
                          onClick={() => router.push('/emails')}
                          variant="primary"
                          className="flex-1"
                        >
                          View All Domains
                        </Button>
                        <Button
                          onClick={() => {
                            setShowBulkImport(false)
                            setShowDomainSelection(false)
                            setResendDomains([])
                            setSelectedDomains(new Set())
                            setImportProgress({})
                          }}
                          variant="secondary"
                        >
                          Import More
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Summary Stats */}
                  {Object.keys(importProgress).length > 0 && (
                    <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">
                          {Object.values(importProgress).filter(p => p.status === 'success').length}
                        </div>
                        <div className="text-xs text-gray-600">Added</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-yellow-600">
                          {Object.values(importProgress).filter(p => p.status === 'exists').length}
                        </div>
                        <div className="text-xs text-gray-600">Existing</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-red-600">
                          {Object.values(importProgress).filter(p => p.status === 'failed').length}
                        </div>
                        <div className="text-xs text-gray-600">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-600">
                          {Object.values(importProgress).filter(p => p.status === 'pending').length}
                        </div>
                        <div className="text-xs text-gray-600">Pending</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!showDomainSelection && !showBulkImport && currentStepIdx === 0 && (
                <div className="">
                  <h2 className="mb-1 text-lg font-semibold text-darkText">{stepsConfig[0].name}</h2>
                  <p className="mb-5 text-sm text-mediumText">{stepsConfig[0].description}</p>
                  <form onSubmit={handleSubmitDomain}>
                    <label htmlFor="domainName" className="mb-1.5 block text-sm font-medium text-darkText">
                      Name
                    </label>
                    <Input
                      id="domainName"
                      type="text"
                      value={domainName}
                      onChange={(e) => {
                        setDomainName(e.target.value)
                        if (error) setError("")
                        if (domainSuggestions.length > 0) setDomainSuggestions([])
                      }}
                      placeholder="0.email"
                      className="mb-2 w-full font-mono text-sm"
                      aria-label="Domain Name"
                      disabled={isLoading || !!preloadedDomain} // Disable if preloaded
                    />
                    {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
                    
                    {/* Domain Suggestions */}
                    {domainSuggestions.length > 0 && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Available alternatives:</h4>
                        <div className="space-y-2">
                          {domainSuggestions.map((suggestion, index) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="flex items-center justify-between w-full p-2 text-sm bg-white border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                            >
                              <span className="font-mono text-blue-800">{suggestion}</span>
                              <span className="text-xs text-blue-600">Click to use</span>
                            </button>
                          ))}
                        </div>
                        {isCheckingSuggestions && (
                          <div className="flex items-center mt-2 text-sm text-blue-600">
                            <Loader width="16" height="16" className="mr-2 animate-spin" />
                            Checking more alternatives...
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Button type="submit" variant="primary" className="mt-4 w-full md:w-auto" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader width="16" height="16" className="mr-2 animate-spin" />
                          Adding Domain...
                        </>
                      ) : (
                        <>
                          Add Domain <ArrowBoldRight width="16" height="16" className="ml-1.5" />
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Import from Resend Section */}
                  <div className="mt-8 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">

                      <h3 className="text-lg font-semibold text-black">Import from</h3>
                      <ResendIcon variant="black" className="h-12 w-16 -ml-1" />
                    </div>
                    <p className="text-sm text-black/80 mb-4">
                      Already have domains in Resend? Paste your API key to import them for bulk processing.
                    </p>
                    <div className="space-y-3">
                      <Input
                        type="password"
                        value={resendApiKey}
                        onChange={(e) => setResendApiKey(e.target.value)}
                        placeholder="Paste your Resend API key (re_...)"
                        className="bg-transparent border text-black placeholder:text-black/50"
                        style={{ borderColor: '#2C3037' }}
                        disabled={isImporting}
                      />
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={handleResendImport}
                        disabled={isImporting || !resendApiKey.trim()}
                      >
                        {isImporting ? (
                          <>
                            <Loader width="16" height="16" className="mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          "Import Domains"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-white/60 mt-3">
                      Your API key is not stored and only used to fetch your domains.
                    </p>
                  </div>
                </div>
              )}

              {!showDomainSelection && !showBulkImport && currentStepIdx === 1 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-semibold text-darkText">{stepsConfig[1].name}</h2>
                    {preloadedProvider && (
                      <div className="flex items-center gap-2">
                        {getProviderDocUrl(preloadedProvider) ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => window.open(getProviderDocUrl(preloadedProvider)!, '_blank')}
                            className="flex items-center gap-2 text-sm border"
                          >
                            <Globe2 width="16" height="16" />
                            <span>{preloadedProvider} Setup Guide</span>
                            <ExternalLink2 width="12" height="12" />
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1 text-sm text-mediumText">
                            <Globe2 width="16" height="16" />
                            <span>Provider: <span className="font-medium">{preloadedProvider}</span></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="mb-6 text-sm text-mediumText">{stepsConfig[1].description}</p>

                  {/* Provider Information Note */}
                  {/* {preloadedProvider && (
                    <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Detected Provider:</strong> We've identified your domain is managed by {preloadedProvider}.
                        {getProviderDocUrl(preloadedProvider) ? (
                          <>
                            {' '}Follow our step-by-step guide above or add the DNS records below to your {preloadedProvider} control panel.
                          </>
                        ) : (
                          <>
                            {' '}Add the DNS records below to your {preloadedProvider} control panel or DNS management interface.
                          </>
                        )}
                      </p>
                    </div>
                  )} */}

                  {/* Verification Status Indicator */}
                  {verificationStatus && (
                    <div className={cn(
                      "mb-6 rounded-lg p-4 border",
                      {
                        "bg-yellow-50 border-yellow-200": verificationStatus === 'pending',
                        "bg-green-50 border-green-200": verificationStatus === 'verified',
                        "bg-red-50 border-red-200": verificationStatus === 'failed',
                      }
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {verificationStatus === 'pending' && (
                            <>
                              <Clock2 width="16" height="16" className="text-yellow-600 mr-2" />
                              <span className="text-sm font-medium text-yellow-800">
                                Verification Pending
                              </span>
                              {isRefreshing && (
                                <Loader width="16" height="16" className="ml-2 animate-spin text-yellow-600" />
                              )}
                            </>
                          )}
                          {verificationStatus === 'verified' && (
                            <>
                              <CircleCheck width="16" height="16" className="text-green-600 mr-2" />
                              <span className="text-sm font-medium text-green-800">
                                Domain Verified
                              </span>
                            </>
                          )}
                          {verificationStatus === 'failed' && (
                            <>
                              <CircleWarning2 width="16" height="16" className="text-red-600 mr-2" />
                              <span className="text-sm font-medium text-red-800">
                                Verification Failed
                              </span>
                            </>
                          )}
                        </div>
                        
                        {/* Periodic Check Indicator */}
                        {periodicCheckEnabled && verificationStatus === 'pending' && (
                          <div className="flex items-center text-xs text-yellow-600">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                            <span>Auto-checking every 5s</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-1">
                        {verificationStatus === 'pending' && !periodicCheckEnabled && "DNS records are being verified. This may take a few hours."}
                        {verificationStatus === 'pending' && periodicCheckEnabled && "We're automatically checking your domain verification status. You'll be redirected once it's verified."}
                        {verificationStatus === 'verified' && "Your domain has been successfully verified and is ready to use."}
                        {verificationStatus === 'failed' && "Please check your DNS records and try again."}
                      </p>
                    </div>
                  )}

                  <div className="overflow-hidden border border-border rounded-lg">
                    {/* Table Header */}
                    <div className="bg-muted/30 border-b border-border">
                      <div className="flex text-sm font-medium text-muted-foreground px-4 py-3">
                        <span className="w-[25%]">Record name</span>
                        <span className="w-[15%]">Type</span>
                        <span className="w-[10%]">TTL</span>
                        <span className="w-[30%]">Value</span>
                        <span className="w-[15%] text-right">Priority</span>
                      </div>
                    </div>

                    {/* Table Body */}
                    <div className="bg-white">
                      {dnsRecords.map((record, idx) => (
                        <div key={`${record.type}-${idx}`} className={cn(
                          "flex transition-colors px-4 py-3",
                          {
                            "bg-green-50 hover:bg-green-100": record.isVerified,
                            "bg-white hover:bg-muted/50": !record.isVerified,
                            "border-b border-border/50": idx < dnsRecords.length - 1
                          }
                        )}>
                          <div className="w-[25%] pr-4">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-sm truncate">
                                {extractRecordName(record.name, domainName)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(extractRecordName(record.name, domainName))}
                                className="h-8 w-8 p-0 hover:bg-gray-100 border border-gray-300 rounded flex-shrink-0 ml-2"
                              >
                                <Clipboard2 width="16" height="16" className="text-gray-600" />
                              </Button>
                            </div>
                          </div>
                          <div className="w-[15%] pr-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{record.type}</span>
                                {record.isVerified && (
                                  <CircleCheck width="16" height="16" className="text-green-600" />
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(record.type)}
                                className="h-8 w-8 p-0 hover:bg-gray-100 border border-gray-300 rounded flex-shrink-0 ml-2"
                              >
                                <Clipboard2 width="16" height="16" className="text-gray-600" />
                              </Button>
                            </div>
                          </div>
                          <div className="w-[10%] pr-4">
                            <span className="text-sm">Auto</span>
                          </div>
                          <div className="w-[30%]">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-sm truncate opacity-50">{record.type === "MX" ? record.value.split(" ")[1] : record.value}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(record.type === "MX" ? record.value.split(" ")[1] : record.value)}
                                className="h-8 w-8 p-0 hover:bg-gray-100 border border-gray-300 rounded flex-shrink-0 ml-2"
                              >
                                <Clipboard2 width="16" height="16" className="text-gray-600" />
                              </Button>
                            </div>
                          </div>
                          <div className="w-[15%] text-right ml-2">
                            <div className="flex items-center justify-end">
                              <span className="text-sm">{record.type === "MX" ? record.value.split(" ")[0] : ""}</span>
                              {record.type === "MX" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(record.type === "MX" ? record.value.split(" ")[0] : "")}
                                  className="h-8 w-8 p-0 hover:bg-gray-100 border border-gray-300 rounded flex-shrink-0 ml-2"
                                >
                                  <Clipboard2 width="16" height="16" className="text-gray-600" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {dnsRecords.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No DNS records available yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

                  <div className="flex gap-3 mt-10">
                    <Button
                      onClick={handleRefresh}
                      variant="primary"
                      className="w-full md:w-auto"
                      disabled={isRefreshing}
                    >
                      <Refresh2 width="16" height="16" className={cn("mr-2", { "animate-spin": isRefreshing })} />
                      Refresh Status
                    </Button>
                    <Button
                      onClick={downloadZoneFile}
                      variant="secondary"
                      className="w-full md:w-auto"
                      disabled={!domainName || dnsRecords.length === 0}
                    >
                      <Download2 width="16" height="16" className="mr-2" />
                      Download Zone File
                    </Button>
                  </div>
                </div>
              )}

              {!showDomainSelection && !showBulkImport && currentStepIdx === 2 && (
                <div className="text-center py-8">
                  <BadgeCheck2 width="80" height="80" className="mx-auto mb-5 text-successGreen" />
                  <h2 className="mb-2 text-2xl font-semibold text-darkText">Domain Verified!</h2>
                  <p className="text-mediumText mb-1">
                    Your domain <span className="font-semibold text-darkText">{domainName}</span> is now ready.
                  </p>
                  <p className="text-sm text-mediumText">{stepsConfig[2].description}</p>
                  <div className="flex gap-4 justify-center mt-10">
                    <Button
                      onClick={() => router.push('/emails')}
                      variant="primary"
                    >
                      View Domains
                    </Button>
                    <Button
                      onClick={() => {
                        setCurrentStepIdx(0)
                        setDomainName("")
                        setDnsRecords([])
                        setDomainId("")
                        setError("")
                        setDomainSuggestions([])
                      }}
                      variant="secondary"
                    >
                      Add Another Domain
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
