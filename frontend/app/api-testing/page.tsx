'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Play, 
  Plus, 
  Trash2, 
  Shield, 
  Globe, 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Zap,
  Send,
  Copy,
  Settings,
  Eye,
  EyeOff,
  Code,
  Key,
  Lock
} from 'lucide-react'

interface ApiEndpoint {
  id: string
  method: string
  url: string
  headers: Record<string, string>
  body: string
  bodyType: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary'
  formData: Array<{
    key: string
    value: string
    type: 'text' | 'file'
    description?: string
  }>
  auth: {
    type: 'none' | 'bearer' | 'basic' | 'api-key'
    token?: string
    username?: string
    password?: string
    keyName?: string
    keyValue?: string
  }
}

interface TestResult {
  id: string
  endpointId: string
  status: 'running' | 'passed' | 'failed'
  statusCode: number
  responseTime: number
  timestamp: Date
  securityChecks: Array<{
    name: string
    description: string
    passed: boolean
  }>
  vulnerabilities: Array<{
    type: string
    description: string
    severity: 'low' | 'medium' | 'high'
  }>
}

export default function ApiTestingPage() {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([])
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)
  const [curlCommand, setCurlCommand] = useState('')
  
  // Manual form state
  const [manualForm, setManualForm] = useState({
    method: 'GET',
    url: '',
    headers: {} as Record<string, string>,
    body: '',
    bodyType: 'none' as 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary',
    formData: [{ key: '', value: '', type: 'text' as 'text' | 'file', description: '' }],
    auth: {
      type: 'none' as 'none' | 'bearer' | 'basic' | 'api-key',
      token: '',
      username: '',
      password: '',
      keyName: '',
      keyValue: ''
    }
  })

  // Header management
  const [newHeaderKey, setNewHeaderKey] = useState('')
  const [newHeaderValue, setNewHeaderValue] = useState('')
  
  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  const addHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      setManualForm(prev => ({
        ...prev,
        headers: { ...prev.headers, [newHeaderKey]: newHeaderValue }
      }))
      setNewHeaderKey('')
      setNewHeaderValue('')
    }
  }

  const removeHeader = (key: string) => {
    setManualForm(prev => ({
      ...prev,
      headers: Object.fromEntries(Object.entries(prev.headers).filter(([k]) => k !== key))
    }))
  }

  // Form data management
  const addFormDataField = () => {
    setManualForm(prev => ({
      ...prev,
      formData: [...prev.formData, { key: '', value: '', type: 'text', description: '' }]
    }))
  }

  const updateFormDataField = (index: number, field: string, value: string) => {
    setManualForm(prev => ({
      ...prev,
      formData: prev.formData.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeFormDataField = (index: number) => {
    setManualForm(prev => ({
      ...prev,
      formData: prev.formData.filter((_, i) => i !== index)
    }))
  }

  const addEndpoint = () => {
    const newEndpoint: ApiEndpoint = {
      id: Date.now().toString(),
      method: manualForm.method,
      url: manualForm.url,
      headers: manualForm.headers,
      body: manualForm.body,
      bodyType: manualForm.bodyType,
      formData: manualForm.formData.filter(item => item.key.trim() !== ''),
      auth: manualForm.auth
    }
    setEndpoints(prev => [...prev, newEndpoint])
    
    // Reset form
    setManualForm({
      method: 'GET',
      url: '',
      headers: {},
      body: '',
      bodyType: 'none',
      formData: [{ key: '', value: '', type: 'text', description: '' }],
      auth: {
        type: 'none',
        token: '',
        username: '',
        password: '',
        keyName: '',
        keyValue: ''
      }
    })
  }

  const parseCurlCommand = () => {
    // Basic cURL parsing (simplified)
    const urlMatch = curlCommand.match(/curl\s+(?:-X\s+(\w+)\s+)?['"]?([^'"]+)['"]?/)
    if (urlMatch) {
      const method = urlMatch[1] || 'GET'
      const url = urlMatch[2]
      
      const newEndpoint: ApiEndpoint = {
        id: Date.now().toString(),
        method: method.toUpperCase(),
        url,
        headers: {},
        body: '',
        bodyType: 'none',
        formData: [],
        auth: { type: 'none' }
      }
      
      setEndpoints(prev => [...prev, newEndpoint])
      setCurlCommand('')
    }
  }

  const runTest = async (endpoint: ApiEndpoint) => {
    const newResult: TestResult = {
      id: Date.now().toString(),
      endpointId: endpoint.id,
      status: 'running',
      statusCode: 0,
      responseTime: 0,
      timestamp: new Date(),
      securityChecks: [],
      vulnerabilities: []
    }
    
    setTestResults(prev => [...prev, newResult])
    
    // Simulate API testing with security analysis
    setTimeout(() => {
      const mockResult: TestResult = {
        ...newResult,
        status: Math.random() > 0.3 ? 'passed' : 'failed',
        statusCode: Math.random() > 0.2 ? 200 : 404,
        responseTime: Math.floor(Math.random() * 1000) + 100,
        securityChecks: [
          {
            name: 'HTTPS Check',
            description: 'Verifies if the endpoint uses HTTPS protocol',
            passed: endpoint.url.startsWith('https://')
          },
          {
            name: 'Authentication Required',
            description: 'Checks if endpoint requires authentication',
            passed: endpoint.auth.type !== 'none'
          },
          {
            name: 'CORS Headers',
            description: 'Validates Cross-Origin Resource Sharing headers',
            passed: Math.random() > 0.4
          },
          {
            name: 'Rate Limiting',
            description: 'Checks for rate limiting implementation',
            passed: Math.random() > 0.6
          }
        ],
        vulnerabilities: Math.random() > 0.7 ? [] : [
          {
            type: 'Insecure HTTP',
            description: 'API endpoint uses HTTP instead of HTTPS',
            severity: 'high' as const
          },
          {
            type: 'Missing Authentication',
            description: 'Endpoint does not require authentication',
            severity: 'medium' as const
          }
        ]
      }
      
      setTestResults(prev => prev.map(r => r.id === newResult.id ? mockResult : r))
    }, 2000)
  }

  const runAllTests = () => {
    endpoints.forEach(endpoint => runTest(endpoint))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600'
      case 'failed': return 'text-red-600'
      case 'running': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4" />
      case 'failed': return <XCircle className="h-4 w-4" />
      case 'running': return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      default: return null
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Testing</h1>
          <p className="text-muted-foreground">
            Comprehensive API security testing and analysis platform
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={runAllTests} disabled={endpoints.length === 0}>
            <Play className="h-4 w-4 mr-2" />
            Run All Tests
          </Button>
        </div>
      </div>

      {/* API Configuration - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Add API endpoints for security testing and analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
              <Tabs defaultValue="manual" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="postman">Postman</TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-6">
                  {/* Request Configuration */}
                  <div className="space-y-4">
                    {/* Method and URL Row */}
                    <div className="flex gap-3">
                      <Select 
                        value={manualForm.method} 
                        onValueChange={(value) => setManualForm(prev => ({ ...prev, method: value }))}
                      >
                        <SelectTrigger className="w-32 h-12 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET" className="text-green-600 font-medium text-base">GET</SelectItem>
                          <SelectItem value="POST" className="text-orange-600 font-medium text-base">POST</SelectItem>
                          <SelectItem value="PUT" className="text-blue-600 font-medium text-base">PUT</SelectItem>
                          <SelectItem value="DELETE" className="text-red-600 font-medium text-base">DELETE</SelectItem>
                          <SelectItem value="PATCH" className="text-purple-600 font-medium text-base">PATCH</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="https://api.example.com/endpoint"
                        value={manualForm.url}
                        onChange={(e) => setManualForm(prev => ({ ...prev, url: e.target.value }))}
                        className="flex-1 font-mono h-12 text-base px-4"
                      />
                      <Button 
                        onClick={() => manualForm.url && runTest({
                          id: 'temp',
                          method: manualForm.method,
                          url: manualForm.url,
                          headers: manualForm.headers,
                          body: manualForm.body,
                          bodyType: manualForm.bodyType,
                          formData: manualForm.formData,
                          auth: manualForm.auth
                        })}
                        disabled={!manualForm.url}
                        className="px-8 h-12 text-base"
                      >
                        <Send className="h-5 w-5 mr-2" />
                        Send
                      </Button>
                    </div>

                    {/* Configuration Tabs */}
                    <Tabs defaultValue="params" className="w-full">
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="params">Params</TabsTrigger>
                        <TabsTrigger value="headers">Headers</TabsTrigger>
                        <TabsTrigger value="body">Body</TabsTrigger>
                        <TabsTrigger value="auth">Auth</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                      </TabsList>

                      {/* Query Parameters */}
                      <TabsContent value="params" className="space-y-4 mt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium">Query Parameters</Label>
                          <Button variant="outline" size="sm" onClick={() => {}}>
                            <Plus className="h-3 w-3 mr-1" />
                            Add Param
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                            <div className="col-span-5">Key</div>
                            <div className="col-span-5">Value</div>
                            <div className="col-span-2">Action</div>
                          </div>
                          <div className="grid grid-cols-12 gap-2">
                            <Input placeholder="param_name" className="col-span-5" />
                            <Input placeholder="param_value" className="col-span-5" />
                            <div className="col-span-2 flex items-center gap-1">
                              <Button variant="ghost" size="sm"><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Headers */}
                      <TabsContent value="headers" className="space-y-4 mt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium">Headers</Label>
                          <Button variant="outline" size="sm" onClick={addHeader}>
                            <Plus className="h-3 w-3 mr-1" />
                            Add Header
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {Object.entries(manualForm.headers).length > 0 && (
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                              <div className="col-span-5">Key</div>
                              <div className="col-span-5">Value</div>
                              <div className="col-span-2">Action</div>
                            </div>
                          )}
                          
                          {Object.entries(manualForm.headers).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-12 gap-2 p-2 bg-muted/50 rounded">
                              <div className="col-span-5 text-sm font-medium truncate">{key}</div>
                              <div className="col-span-5 text-sm truncate">{value}</div>
                              <div className="col-span-2 flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => removeHeader(key)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          
                          <div className="grid grid-cols-12 gap-3">
                            <Input
                              placeholder="Content-Type"
                              value={newHeaderKey}
                              onChange={(e) => setNewHeaderKey(e.target.value)}
                              className="col-span-5 h-11 text-base"
                            />
                            <Input
                              placeholder="application/json"
                              value={newHeaderValue}
                              onChange={(e) => setNewHeaderValue(e.target.value)}
                              className="col-span-5 h-11 text-base"
                            />
                            <div className="col-span-2 flex items-center gap-1">
                              <Button variant="ghost" size="lg" onClick={addHeader} className="h-11 w-full">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Request Body */}
                      <TabsContent value="body" className="space-y-4 mt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium">Request Body</Label>
                          <Badge variant="outline" className="text-xs">
                            {manualForm.bodyType.toUpperCase()}
                          </Badge>
                        </div>

                        {/* Body Type Selection */}
                        <div className="space-y-4">
                          <div className="flex gap-2 flex-wrap">
                            {[
                              { value: 'none', label: 'None', color: 'text-gray-600' },
                              { value: 'json', label: 'JSON', color: 'text-blue-600' },
                              { value: 'form-data', label: 'Form Data', color: 'text-green-600' },
                              { value: 'x-www-form-urlencoded', label: 'URL Encoded', color: 'text-orange-600' },
                              { value: 'raw', label: 'Raw Text', color: 'text-purple-600' },
                              { value: 'binary', label: 'Binary', color: 'text-red-600' }
                            ].map((type) => (
                              <Button
                                key={type.value}
                                variant={manualForm.bodyType === type.value ? "default" : "outline"}
                                size="sm"
                                onClick={() => setManualForm(prev => ({ ...prev, bodyType: type.value as any }))}
                                className={`${type.color}`}
                              >
                                {type.label}
                              </Button>
                            ))}
                          </div>

                          {/* Body Content Based on Type */}
                          {manualForm.bodyType === 'none' && (
                            <div className="text-center py-8 text-muted-foreground">
                              <div className="text-4xl mb-2">∅</div>
                              <p className="text-sm">No body content will be sent with this request.</p>
                            </div>
                          )}

                          {manualForm.bodyType === 'json' && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-base font-medium">JSON Body</Label>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm">
                                    <Code className="h-4 w-4 mr-1" />
                                    Prettify
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copy
                                  </Button>
                                </div>
                              </div>
                              <Textarea
                                placeholder='{\n  "name": "John Doe",\n  "email": "john@example.com",\n  "age": 30\n}'
                                value={manualForm.body}
                                onChange={(e) => setManualForm(prev => ({ ...prev, body: e.target.value }))}
                                rows={12}
                                className="font-mono text-base resize-none leading-relaxed"
                              />
                            </div>
                          )}

                          {manualForm.bodyType === 'form-data' && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">Form Data Fields</Label>
                                <Button variant="outline" size="sm" onClick={addFormDataField}>
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Field
                                </Button>
                              </div>
                              
                              <div className="space-y-2">
                                {manualForm.formData.length > 0 && (
                                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                                    <div className="col-span-4">Key</div>
                                    <div className="col-span-4">Value</div>
                                    <div className="col-span-2">Type</div>
                                    <div className="col-span-2">Action</div>
                                  </div>
                                )}
                                
                                {manualForm.formData.map((field, index) => (
                                  <div key={index} className="grid grid-cols-12 gap-3 p-4 border rounded-lg bg-muted/20">
                                    <Input
                                      placeholder="field_name"
                                      value={field.key}
                                      onChange={(e) => updateFormDataField(index, 'key', e.target.value)}
                                      className="col-span-4 h-11 text-base"
                                    />
                                    {field.type === 'text' ? (
                                      <Input
                                        placeholder="field_value"
                                        value={field.value}
                                        onChange={(e) => updateFormDataField(index, 'value', e.target.value)}
                                        className="col-span-4 h-11 text-base"
                                      />
                                    ) : (
                                      <div className="col-span-4">
                                        <Input
                                          type="file"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) updateFormDataField(index, 'value', file.name)
                                          }}
                                          className="h-11 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary/10"
                                        />
                                      </div>
                                    )}
                                    <Select
                                      value={field.type}
                                      onValueChange={(value) => updateFormDataField(index, 'type', value)}
                                    >
                                      <SelectTrigger className="col-span-2 h-11">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="file">File</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <div className="col-span-2 flex items-center gap-1">
                                      <Button variant="outline" size="lg" onClick={() => removeFormDataField(index)} className="h-11 w-full">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {manualForm.bodyType === 'x-www-form-urlencoded' && (
                            <div className="space-y-4">
                              <Label className="text-base font-medium">URL Encoded Data</Label>
                              <Textarea
                                placeholder="key1=value1&key2=value2&key3=value3"
                                value={manualForm.body}
                                onChange={(e) => setManualForm(prev => ({ ...prev, body: e.target.value }))}
                                rows={10}
                                className="font-mono text-base leading-relaxed"
                              />
                            </div>
                          )}

                          {manualForm.bodyType === 'raw' && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-base font-medium">Raw Text</Label>
                                <Select defaultValue="text">
                                  <SelectTrigger className="w-40 h-10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="javascript">JavaScript</SelectItem>
                                    <SelectItem value="json">JSON</SelectItem>
                                    <SelectItem value="html">HTML</SelectItem>
                                    <SelectItem value="xml">XML</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Textarea
                                placeholder="Enter raw text, XML, HTML, or any other format..."
                                value={manualForm.body}
                                onChange={(e) => setManualForm(prev => ({ ...prev, body: e.target.value }))}
                                rows={12}
                                className="font-mono text-base resize-none leading-relaxed"
                              />
                            </div>
                          )}

                          {manualForm.bodyType === 'binary' && (
                            <div className="space-y-2">
                              <Label className="text-sm">Binary File</Label>
                              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground mb-2">
                                  Select a binary file to upload
                                </p>
                                <Button variant="outline" size="sm">
                                  <Upload className="h-3 w-3 mr-1" />
                                  Choose File
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* Authentication */}
                      <TabsContent value="auth" className="space-y-4 mt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium">Authentication</Label>
                          <Badge variant="outline" className="text-xs">
                            {manualForm.auth.type.toUpperCase()}
                          </Badge>
                        </div>

                        <Select
                          value={manualForm.auth.type}
                          onValueChange={(value: any) => setManualForm(prev => ({
                            ...prev,
                            auth: { ...prev.auth, type: value }
                          }))}
                        >
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                No Authentication
                              </div>
                            </SelectItem>
                            <SelectItem value="bearer">
                              <div className="flex items-center gap-2">
                                <Key className="h-3 w-3 text-blue-500" />
                                Bearer Token
                              </div>
                            </SelectItem>
                            <SelectItem value="basic">
                              <div className="flex items-center gap-2">
                                <Lock className="h-3 w-3 text-green-500" />
                                Basic Auth
                              </div>
                            </SelectItem>
                            <SelectItem value="api-key">
                              <div className="flex items-center gap-2">
                                <Key className="h-3 w-3 text-orange-500" />
                                API Key
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {manualForm.auth.type === 'bearer' && (
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Bearer Token</Label>
                            <div className="relative">
                              <Input
                                placeholder="Enter your bearer token"
                                type={showPasswords ? "text" : "password"}
                                value={manualForm.auth.token}
                                onChange={(e) => setManualForm(prev => ({
                                  ...prev,
                                  auth: { ...prev.auth, token: e.target.value }
                                }))}
                                className="pr-12 font-mono h-12 text-base"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-12 px-3"
                                onClick={() => setShowPasswords(!showPasswords)}
                              >
                                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        )}

                        {manualForm.auth.type === 'basic' && (
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label className="text-base font-medium">Username</Label>
                              <Input
                                placeholder="Enter username"
                                value={manualForm.auth.username}
                                onChange={(e) => setManualForm(prev => ({
                                  ...prev,
                                  auth: { ...prev.auth, username: e.target.value }
                                }))}
                                className="h-12 text-base"
                              />
                            </div>
                            <div className="space-y-3">
                              <Label className="text-base font-medium">Password</Label>
                              <div className="relative">
                                <Input
                                  placeholder="Enter password"
                                  type={showPasswords ? "text" : "password"}
                                  value={manualForm.auth.password}
                                  onChange={(e) => setManualForm(prev => ({
                                    ...prev,
                                    auth: { ...prev.auth, password: e.target.value }
                                  }))}
                                  className="pr-12 h-12 text-base"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-12 px-3"
                                  onClick={() => setShowPasswords(!showPasswords)}
                                >
                                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {manualForm.auth.type === 'api-key' && (
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label className="text-base font-medium">Key Name</Label>
                              <Input
                                placeholder="e.g., X-API-Key"
                                value={manualForm.auth.keyName}
                                onChange={(e) => setManualForm(prev => ({
                                  ...prev,
                                  auth: { ...prev.auth, keyName: e.target.value }
                                }))}
                                className="h-12 text-base"
                              />
                            </div>
                            <div className="space-y-3">
                              <Label className="text-base font-medium">API Key</Label>
                              <div className="relative">
                                <Input
                                  placeholder="Enter your API key"
                                  type={showPasswords ? "text" : "password"}
                                  value={manualForm.auth.keyValue}
                                  onChange={(e) => setManualForm(prev => ({
                                    ...prev,
                                    auth: { ...prev.auth, keyValue: e.target.value }
                                  }))}
                                  className="pr-12 font-mono h-12 text-base"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-12 px-3"
                                  onClick={() => setShowPasswords(!showPasswords)}
                                >
                                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      {/* Settings */}
                      <TabsContent value="settings" className="space-y-4 mt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium">Request Settings</Label>
                          <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
                            <Settings className="h-3 w-3 mr-1" />
                            {showAdvanced ? 'Hide' : 'Show'} Advanced
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm">Timeout (ms)</Label>
                              <Input placeholder="30000" defaultValue="30000" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Follow Redirects</Label>
                              <Select defaultValue="true">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Yes</SelectItem>
                                  <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {showAdvanced && (
                            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                              <h4 className="text-sm font-medium">Advanced Settings</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm">Max Redirects</Label>
                                  <Input placeholder="10" defaultValue="10" />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm">Keep Alive</Label>
                                  <Select defaultValue="true">
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="true">Enabled</SelectItem>
                                      <SelectItem value="false">Disabled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>

                    {/* Save Endpoint Button */}
                    <div className="pt-6 border-t bg-muted/20 -mx-6 px-6 pb-2">
                      <Button onClick={addEndpoint} className="w-full h-12 text-base font-medium" disabled={!manualForm.url}>
                        <Plus className="h-5 w-5 mr-2" />
                        Save to Collection
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="curl" className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Paste cURL Command</Label>
                    <Textarea
                      placeholder="curl -X GET 'https://api.example.com/users' \&#10;  -H 'Authorization: Bearer token' \&#10;  -H 'Content-Type: application/json'"
                      value={curlCommand}
                      onChange={(e) => setCurlCommand(e.target.value)}
                      rows={10}
                      className="font-mono text-base leading-relaxed"
                    />
                  </div>
                  <Button onClick={parseCurlCommand} className="w-full h-12 text-base font-medium" disabled={!curlCommand.trim()}>
                    <FileText className="h-5 w-5 mr-2" />
                    Parse & Add to Collection
                  </Button>
                </TabsContent>

                <TabsContent value="postman" className="space-y-4">
                  <div className="text-center py-8">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Import Postman Collection</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload your Postman collection JSON file
                    </p>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Endpoint List */}
              {endpoints.length > 0 && (
                <div className="mt-6 space-y-2">
                  <Label>Added Endpoints ({endpoints.length})</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {endpoints.map((endpoint) => (
                      <div
                        key={endpoint.id}
                        className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedEndpoint(endpoint)}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {endpoint.method}
                          </Badge>
                          <span className="text-sm truncate">{endpoint.url}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              runTest(endpoint);
                            }}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEndpoints(prev => prev.filter(e => e.id !== endpoint.id));
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

      {/* Test Results Section */}
      {testResults.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Test Results
            </CardTitle>
            <CardDescription>
              Security analysis and performance results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result) => {
                const endpoint = endpoints.find(e => e.id === result.endpointId);
                return (
                  <Card key={result.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{endpoint?.method}</Badge>
                          <span className="font-medium">{endpoint?.url}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${getStatusColor(result.status)}`}>
                          {getStatusIcon(result.status)}
                          <span className="capitalize">{result.status}</span>
                        </div>
                      </div>
                      {result.status !== 'running' && (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Status: {result.statusCode}</span>
                          <span>Response: {result.responseTime}ms</span>
                          <span>Tested: {result.timestamp.toLocaleTimeString()}</span>
                        </div>
                      )}
                    </CardHeader>
                    
                    {result.status !== 'running' && (
                          <CardContent className="pt-0">
                            <Tabs defaultValue="security" className="space-y-4">
                              <TabsList>
                                <TabsTrigger value="security">Security</TabsTrigger>
                                <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
                                <TabsTrigger value="performance">Performance</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="security" className="space-y-3">
                                {result.securityChecks.map((check, index) => (
                                  <div key={index} className="flex items-start gap-3 p-3 border rounded">
                                    {check.passed ? (
                                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                    ) : (
                                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                    )}
                                    <div>
                                      <p className="font-medium">{check.name}</p>
                                      <p className="text-sm text-muted-foreground">{check.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </TabsContent>
                              
                              <TabsContent value="vulnerabilities" className="space-y-3">
                                {result.vulnerabilities.length > 0 ? (
                                  result.vulnerabilities.map((vuln, index) => (
                                    <Alert key={index}>
                                      <AlertTriangle className="h-4 w-4" />
                                      <AlertDescription>
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <p className="font-medium">{vuln.type}</p>
                                            <p className="text-sm mt-1">{vuln.description}</p>
                                          </div>
                                          <Badge variant={vuln.severity === 'high' ? 'destructive' : 'secondary'}>
                                            {vuln.severity}
                                          </Badge>
                                        </div>
                                      </AlertDescription>
                                    </Alert>
                                  ))
                                ) : (
                                  <div className="text-center py-8">
                                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                                    <p className="text-sm text-muted-foreground">No vulnerabilities detected</p>
                                  </div>
                                )}
                              </TabsContent>
                              
                              <TabsContent value="performance" className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-3 border rounded text-center">
                                    <Zap className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                                    <p className="text-2xl font-bold">{result.responseTime}ms</p>
                                    <p className="text-sm text-muted-foreground">Response Time</p>
                                  </div>
                                  <div className="p-3 border rounded text-center">
                                    <Globe className="h-8 w-8 mx-auto mb-2 text-green-500" />
                                    <p className="text-2xl font-bold">{result.statusCode}</p>
                                    <p className="text-sm text-muted-foreground">Status Code</p>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
                
                <div className="flex gap-2 mt-6">
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                  <Button variant="outline">
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Globe className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Tests Run Yet</h3>
                  <p className="text-muted-foreground">
                    Add API endpoints and run tests to see security analysis results
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
    </div>
  )
}
