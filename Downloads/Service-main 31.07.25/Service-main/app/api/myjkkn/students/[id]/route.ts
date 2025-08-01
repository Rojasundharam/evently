/**
 * MyJKKN Student by ID API Proxy Route
 * Handles requests to fetch individual student data from MyJKKN API
 */

import { NextRequest, NextResponse } from 'next/server'

const MYJKKN_BASE_URL = 'https://myadmin.jkkn.ac.in/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get API key from request headers
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key is required' },
        { status: 401 }
      )
    }

    // Validate API key format
    if (!/^jk_[a-zA-Z0-9]+_[a-zA-Z0-9]+$/.test(apiKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key format' },
        { status: 401 }
      )
    }

    // Validate student ID parameter
    const studentId = params.id
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Construct MyJKKN API URL
    const myJkknUrl = `${MYJKKN_BASE_URL}/api-management/students/${studentId}`

    // Make request to MyJKKN API
    const response = await fetch(myJkknUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      // Handle specific HTTP error codes
      let errorMessage = 'API request failed'
      switch (response.status) {
        case 401:
          errorMessage = 'Authentication failed. Please check your API key.'
          break
        case 403:
          errorMessage = 'Access forbidden. Your API key may not have the required permissions.'
          break
        case 404:
          errorMessage = 'Student not found.'
          break
        case 429:
          errorMessage = 'Rate limit exceeded. Please try again later.'
          break
        case 500:
          errorMessage = 'Internal server error. Please contact support.'
          break
        default:
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('MyJKKN API Proxy Error:', error)
    
    let errorMessage = 'Internal server error'
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Failed to connect to MyJKKN API. Please check if the service is available.'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// Handle other HTTP methods
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
} 