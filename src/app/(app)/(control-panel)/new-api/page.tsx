"use client"

import { useState } from 'react'
import { Plus, Trash2, Globe, FileText, Settings, AlertCircle, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type Header = {
    key: string;
    value: string;
}

const NewApiPage = () => {
    const [url, setUrl] = useState('')
    const [method, setMethod] = useState('GET')
    const [headers, setHeaders] = useState<Header[]>([{ key: '', value: '' }])
    const [body, setBody] = useState('')
    const [expectedStatus, setExpectedStatus] = useState('200')
    const [expectedStructure, setExpectedStructure] = useState('')

    const addHeader = () => {
        setHeaders([...headers, { key: '', value: '' }])
    }

    const removeHeader = (index: number) => {
        const newHeaders = [...headers]
        newHeaders.splice(index, 1)
        setHeaders(newHeaders)
    }

    const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
        const newHeaders = [...headers]
        newHeaders[index][field] = value
        setHeaders(newHeaders)
    }

    const handleSave = () => {
        // Validate JSON if present
        if (body) {
            try {
                JSON.parse(body)
            } catch (e) {
                toast.error('Invalid JSON in Request Body')
                return
            }
        }

        if (expectedStructure) {
            try {
                JSON.parse(expectedStructure)
            } catch (e) {
                toast.error('Invalid JSON in Expected Response Structure')
                return
            }
        }

        if (!url) {
            toast.error('Endpoint URL is required')
            return
        }

        toast.success('API configuration saved successfully')
        console.log({
            url,
            method,
            headers: headers.filter(h => h.key),
            body,
            expectedStatus,
            expectedStructure
        })
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Add New API</h1>
                <p className="text-muted-foreground">Configure the endpoint and your expectations for monitoring.</p>
            </div>

            <div className="grid gap-6">
                {/* Request Configuration */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            Request Details
                        </CardTitle>
                        <CardDescription>Specify the endpoint and HTTP method.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-1 space-y-2">
                                <Label htmlFor="method">Method</Label>
                                <Select value={method} onValueChange={setMethod}>
                                    <SelectTrigger id="method">
                                        <SelectValue placeholder="HTTP Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-3 space-y-2">
                                <Label htmlFor="url">Endpoint URL</Label>
                                <div className="relative">
                                    <Input
                                        id="url"
                                        placeholder="https://api.example.com/v1/users"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="pl-3"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Headers</Label>
                                <Button variant="outline" size="sm" onClick={addHeader} className="h-8">
                                    <Plus className="h-4 w-4 mr-1" /> Add Header
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {headers.map((header, index) => (
                                    <div key={index} className="flex gap-2 items-start group">
                                        <Input
                                            placeholder="Key (e.g. Authorization)"
                                            value={header.key}
                                            onChange={(e) => updateHeader(index, 'key', e.target.value)}
                                            className="flex-1"
                                        />
                                        <Input
                                            placeholder="Value"
                                            value={header.value}
                                            onChange={(e) => updateHeader(index, 'value', e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeHeader(index)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                            disabled={headers.length === 1 && !header.key && !header.value}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {method !== 'GET' && (
                            <div className="space-y-2 animate-in slide-in-from-top duration-300">
                                <Label htmlFor="body">Request Body (JSON)</Label>
                                <Textarea
                                    id="body"
                                    placeholder='{"name": "test"}'
                                    className="font-mono text-sm min-h-[120px]"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Expectations Configuration */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-primary" />
                            Expectations
                        </CardTitle>
                        <CardDescription>What defines a "healthy" response?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-1 space-y-2">
                                <Label htmlFor="status">Status Code</Label>
                                <Input
                                    id="status"
                                    placeholder="200"
                                    value={expectedStatus}
                                    onChange={(e) => setExpectedStatus(e.target.value)}
                                />
                            </div>
                            <div className="col-span-3 space-y-2">
                                <Label htmlFor="structure" className="flex items-center gap-1.5">
                                    Expected Response Structure (JSON)
                                    <Badge variant="secondary" className="font-normal text-[10px]">Optional</Badge>
                                </Label>
                                <Textarea
                                    id="structure"
                                    placeholder='{"id": "string", "name": "string"}'
                                    className="font-mono text-sm min-h-[120px]"
                                    value={expectedStructure}
                                    onChange={(e) => setExpectedStructure(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t border-border/50 bg-muted/20 flex justify-end gap-3 pt-6 pb-6">
                        <Button variant="ghost" onClick={() => window.history.back()}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                            <Save className="h-4 w-4 mr-2" />
                            Save API
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

export default NewApiPage