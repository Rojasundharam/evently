/**
 * MyJKKN API Proxy Route
 * Handles all MyJKKN API requests to bypass CORS issues
 */

import { NextRequest, NextResponse } from 'next/server'

const MYJKKN_BASE_URL = 'https://myadmin.jkkn.ac.in/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(request, resolvedParams, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(request, resolvedParams, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(request, resolvedParams, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(request, resolvedParams, 'DELETE')
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.replace('Bearer ', '')
    
    // Validate API key format
    if (!/^(jk_[a-zA-Z0-9]+_[a-zA-Z0-9]+|jkkn_[a-zA-Z0-9]+_[a-zA-Z0-9]+)$/.test(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 401 }
      )
    }

    // Build the target URL
    const pathString = params.path.join('/')
    const searchParams = request.nextUrl.searchParams
    let targetUrl = `${MYJKKN_BASE_URL}/${pathString}`
    
    if (searchParams.toString()) {
      targetUrl += `?${searchParams.toString()}`
    }

    console.log(`MyJKKN Proxy: ${method} ${targetUrl}`)

    // Prepare headers for the upstream request
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'MyJKKN-Service-Proxy/1.0'
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
      mode: 'cors',
      credentials: 'omit'
    }

    // Add body for non-GET requests
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const body = await request.text()
        if (body) {
          fetchOptions.body = body
        }
      } catch (error) {
        console.error('Error reading request body:', error)
      }
    }

    // Make the upstream request
    const response = await fetch(targetUrl, fetchOptions)
    
    console.log(`MyJKKN Proxy Response: ${response.status} ${response.statusText}`)

    // Get response data
    const responseText = await response.text()
    let responseData: any

    try {
      responseData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError)
      responseData = { error: 'Invalid JSON response from MyJKKN API' }
    }

    // Create response with CORS headers
    const nextResponse = NextResponse.json(responseData, {
      status: response.status,
      statusText: response.statusText
    })

    // Add CORS headers
    nextResponse.headers.set('Access-Control-Allow-Origin', '*')
    nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return nextResponse

  } catch (error) {
    console.error('MyJKKN Proxy Error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown proxy error'
    
    const errorResponse = NextResponse.json(
      { 
        error: 'Proxy request failed', 
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )

    // Add CORS headers even for error responses
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return errorResponse
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
} 