"use client"

import { useState, useEffect } from 'react'
import { useUpdateWebhookMutation } from '@/features/webhooks/hooks'
import { Webhook, UpdateWebhookData } from '@/features/webhooks/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import Gear2 from '@/components/icons/gear-2'
import TabClose from '@/components/icons/tab-close'
import CirclePlus from '@/components/icons/circle-plus'
import { toast } from 'sonner'

interface EditWebhookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  webhook: Webhook | null
}

export function EditWebhookDialog({ open, onOpenChange, webhook }: EditWebhookDialogProps) {
  const [formData, setFormData] = useState<UpdateWebhookData>({
    name: '',
    url: '',
    description: '',
    isActive: true,
    timeout: 30,
    retryAttempts: 3,
    headers: {}
  })
  const [headerKey, setHeaderKey] = useState('')
  const [headerValue, setHeaderValue] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateWebhookMutation = useUpdateWebhookMutation()

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        if (!updateWebhookMutation.isPending && webhook && validateForm()) {
          handleSubmit(event as any)
        }
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, updateWebhookMutation.isPending, webhook, formData])

  // Populate form when webhook changes
  useEffect(() => {
    if (webhook) {
      let parsedHeaders = {}
      if (webhook.headers) {
        try {
          parsedHeaders = JSON.parse(webhook.headers)
        } catch (e) {
          console.error('Failed to parse webhook headers:', e)
        }
      }

      setFormData({
        name: webhook.name,
        url: webhook.url,
        description: webhook.description || '',
        isActive: webhook.isActive ?? true,
        timeout: webhook.timeout || 30,
        retryAttempts: webhook.retryAttempts || 3,
        headers: parsedHeaders
      })
    }
  }, [webhook])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.url?.trim()) {
      newErrors.url = 'URL is required'
    } else {
      try {
        new URL(formData.url)
      } catch {
        newErrors.url = 'Please enter a valid URL'
      }
    }

    if (formData.timeout && (formData.timeout < 1 || formData.timeout > 300)) {
      newErrors.timeout = 'Timeout must be between 1 and 300 seconds'
    }

    if (formData.retryAttempts && (formData.retryAttempts < 0 || formData.retryAttempts > 10)) {
      newErrors.retryAttempts = 'Retry attempts must be between 0 and 10'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!webhook || !validateForm()) {
      return
    }

    try {
      await updateWebhookMutation.mutateAsync({
        id: webhook.id,
        data: formData
      })
      toast.success('Webhook updated successfully!')
      handleClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update webhook')
    }
  }

  const handleClose = () => {
    setHeaderKey('')
    setHeaderValue('')
    setErrors({})
    onOpenChange(false)
  }

  const addHeader = () => {
    if (headerKey.trim() && headerValue.trim()) {
      setFormData(prev => ({
        ...prev,
        headers: {
          ...prev.headers,
          [headerKey.trim()]: headerValue.trim()
        }
      }))
      setHeaderKey('')
      setHeaderValue('')
    }
  }

  const removeHeader = (key: string) => {
    setFormData(prev => {
      const newHeaders = { ...prev.headers }
      delete newHeaders[key]
      return {
        ...prev,
        headers: newHeaders
      }
    })
  }

  if (!webhook) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
              <Gear2 width="16" height="16" className="text-blue-600" />
            </div>
            Edit Webhook
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <p className="text-xs text-gray-600">Enable or disable this webhook</p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Production Webhook"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              value={formData.url || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://your-app.com/webhooks/inbound"
              className={errors.url ? 'border-red-500' : ''}
            />
            {errors.url && <p className="text-sm text-red-500">{errors.url}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description of this webhook's purpose"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                min="1"
                max="300"
                value={formData.timeout || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30 }))}
                className={errors.timeout ? 'border-red-500' : ''}
              />
              {errors.timeout && <p className="text-sm text-red-500">{errors.timeout}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="retryAttempts">Retry Attempts</Label>
              <Input
                id="retryAttempts"
                type="number"
                min="0"
                max="10"
                value={formData.retryAttempts || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) || 3 }))}
                className={errors.retryAttempts ? 'border-red-500' : ''}
              />
              {errors.retryAttempts && <p className="text-sm text-red-500">{errors.retryAttempts}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Custom Headers</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Header name"
                value={headerKey}
                onChange={(e) => setHeaderKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHeader())}
              />
              <Input
                placeholder="Header value"
                value={headerValue}
                onChange={(e) => setHeaderValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHeader())}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addHeader}
                disabled={!headerKey.trim() || !headerValue.trim()}
              >
                <CirclePlus width="16" height="16" />
              </Button>
            </div>
            
            {Object.entries(formData.headers || {}).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(formData.headers || {}).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {value}
                    <button
                      type="button"
                      onClick={() => removeHeader(key)}
                      className="ml-1 hover:text-red-500"
                    >
                      <TabClose width="12" height="12" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </form>

        <DialogFooter className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Press Cmd+Enter to submit
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateWebhookMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateWebhookMutation.isPending ? 'Updating...' : 'Update Webhook'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 