import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Key, 
  Shield, 
  Zap, 
  TestTube, 
  Save,
  Eye,
  EyeOff
} from 'lucide-react'

interface LLMProvider {
  id: string
  name: string
  endpoint: string
  apiKey: string
  model: string
  enabled: boolean
}

interface SecuritySettings {
  enableRealTimeScanning: boolean
  blockSuspiciousRequests: boolean
  logAllRequests: boolean
  enableBiasDetection: boolean
  enableContentFiltering: boolean
  maxTokens: number
  rateLimit: number
  confidenceThreshold: number
}

interface LLMConfigurationProps {
  providers: LLMProvider[]
  securitySettings: SecuritySettings
  onUpdateProvider: (provider: LLMProvider) => void
  onUpdateSettings: (settings: SecuritySettings) => void
  onTestConnection: (providerId: string) => void
}

export default function LLMConfiguration({
  providers,
  securitySettings,
  onUpdateProvider,
  onUpdateSettings,
  onTestConnection
}: LLMConfigurationProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>(providers[0]?.id || '')
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({})
  const [isTestingConnection, setIsTestingConnection] = useState<{ [key: string]: boolean }>({})

  const currentProvider = providers.find(p => p.id === selectedProvider)

  const handleProviderUpdate = (field: keyof LLMProvider, value: string | boolean) => {
    if (currentProvider) {
      onUpdateProvider({
        ...currentProvider,
        [field]: value
      })
    }
  }

  const handleSettingsUpdate = (field: keyof SecuritySettings, value: boolean | number) => {
    onUpdateSettings({
      ...securitySettings,
      [field]: value
    })
  }

  const handleTestConnection = async (providerId: string) => {
    setIsTestingConnection(prev => ({ ...prev, [providerId]: true }))
    
    // Simulate API test
    setTimeout(() => {
      onTestConnection(providerId)
      setIsTestingConnection(prev => ({ ...prev, [providerId]: false }))
    }, 2000)
  }

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          LLM Gateway Configuration
        </CardTitle>
        <CardDescription>
          Configure your LLM providers and security settings for real-time monitoring
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="providers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              LLM Providers
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-6">
            {/* Provider Selection */}
            <div className="space-y-4">
              <Label htmlFor="provider-select">Select LLM Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an LLM provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center gap-2">
                        {provider.name}
                        <Badge variant={provider.enabled ? "default" : "secondary"}>
                          {provider.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Provider Configuration */}
            {currentProvider && (
              <div className="space-y-4 border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{currentProvider.name} Configuration</h3>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={currentProvider.enabled}
                      onCheckedChange={(checked) => handleProviderUpdate('enabled', checked)}
                    />
                    <Label>Enable Provider</Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="endpoint">API Endpoint</Label>
                    <Input
                      id="endpoint"
                      value={currentProvider.endpoint}
                      onChange={(e) => handleProviderUpdate('endpoint', e.target.value)}
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={currentProvider.model}
                      onChange={(e) => handleProviderUpdate('model', e.target.value)}
                      placeholder="gpt-4"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="relative">
                    <Input
                      id="api-key"
                      type={showApiKey[currentProvider.id] ? "text" : "password"}
                      value={currentProvider.apiKey}
                      onChange={(e) => handleProviderUpdate('apiKey', e.target.value)}
                      placeholder="sk-..."
                      className="pr-20"
                    />
                    <div className="absolute right-1 top-1 flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleApiKeyVisibility(currentProvider.id)}
                        className="h-8 w-8 p-0"
                      >
                        {showApiKey[currentProvider.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleTestConnection(currentProvider.id)}
                    disabled={isTestingConnection[currentProvider.id] || !currentProvider.apiKey}
                    className="flex items-center gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    {isTestingConnection[currentProvider.id] ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Configuration
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Real-time Security Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Real-time Protection
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Real-time Scanning</Label>
                      <p className="text-sm text-muted-foreground">
                        Monitor all requests for malicious content
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.enableRealTimeScanning}
                      onCheckedChange={(checked) => handleSettingsUpdate('enableRealTimeScanning', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Block Suspicious Requests</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically block detected threats
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.blockSuspiciousRequests}
                      onCheckedChange={(checked) => handleSettingsUpdate('blockSuspiciousRequests', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Log All Requests</Label>
                      <p className="text-sm text-muted-foreground">
                        Keep detailed logs for analysis
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.logAllRequests}
                      onCheckedChange={(checked) => handleSettingsUpdate('logAllRequests', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Content Filtering */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Content Filtering</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Bias Detection</Label>
                      <p className="text-sm text-muted-foreground">
                        Detect biased or discriminatory content
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.enableBiasDetection}
                      onCheckedChange={(checked) => handleSettingsUpdate('enableBiasDetection', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Content Filtering</Label>
                      <p className="text-sm text-muted-foreground">
                        Filter harmful or inappropriate content
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.enableContentFiltering}
                      onCheckedChange={(checked) => handleSettingsUpdate('enableContentFiltering', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Threshold Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Threshold Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max-tokens">Max Tokens</Label>
                  <Input
                    id="max-tokens"
                    type="number"
                    value={securitySettings.maxTokens}
                    onChange={(e) => handleSettingsUpdate('maxTokens', parseInt(e.target.value))}
                    min="1"
                    max="4096"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum tokens per request
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate-limit">Rate Limit (per minute)</Label>
                  <Input
                    id="rate-limit"
                    type="number"
                    value={securitySettings.rateLimit}
                    onChange={(e) => handleSettingsUpdate('rateLimit', parseInt(e.target.value))}
                    min="1"
                    max="1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Requests per minute
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confidence-threshold">Confidence Threshold (%)</Label>
                  <Input
                    id="confidence-threshold"
                    type="number"
                    value={securitySettings.confidenceThreshold}
                    onChange={(e) => handleSettingsUpdate('confidenceThreshold', parseInt(e.target.value))}
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum confidence for threat detection
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
