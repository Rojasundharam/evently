/**
 * StudentDataExample Component
 * Demonstrates various ways to use the MyJKKN API for student data
 */

'use client'

import React, { useState } from 'react'
import { useStudents } from '../../hooks/useStudents'
import { myJkknApi, StudentData } from '../../lib/myjkkn-api'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'
import { useToast } from '../ui/use-toast'
import { Code, Play, Database, User } from 'lucide-react'

export function StudentDataExample() {
  const { toast } = useToast()
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null)
  const [loadingStudent, setLoadingStudent] = useState(false)

  // Use the custom hook with different configurations
  const {
    students: allStudents,
    loading: loadingAll,
    error: errorAll,
    pagination
  } = useStudents({
    page: 1,
    limit: 5,
    autoFetch: true
  })

  const {
    students: csStudents,
    loading: loadingCS,
    error: errorCS
  } = useStudents({
    department: 'Computer Science and Engineering',
    limit: 3,
    autoFetch: true
  })

  const {
    students: incompleteProfiles,
    loading: loadingIncomplete,
    error: errorIncomplete
  } = useStudents({
    profileComplete: false,
    limit: 3,
    autoFetch: true
  })

  // Fetch individual student by ID
  const fetchStudentById = async (studentId: string) => {
    setLoadingStudent(true)
    setSelectedStudentId(studentId)
    
    try {
      const response = await myJkknApi.getStudentById(studentId)
      if (response.success && response.data) {
        setSelectedStudent(response.data)
        toast({
          title: "Student Loaded",
          description: `Loaded details for ${response.data.student_name}`,
        })
      } else {
        throw new Error(response.error || 'Failed to fetch student')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      setSelectedStudent(null)
    } finally {
      setLoadingStudent(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          MyJKKN API Examples
        </h2>
        <p className="text-muted-foreground">
          Demonstrating different ways to use the student data API
        </p>
      </div>

      <div className="grid gap-6">
        {/* Example 1: All Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              All Students (Paginated)
            </CardTitle>
            <CardDescription>
              Fetch all students with pagination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <code className="text-sm">
                  {`useStudents({ page: 1, limit: 5, autoFetch: true })`}
                </code>
              </div>
              
              {loadingAll ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : errorAll ? (
                <div className="text-red-600 text-sm">{errorAll}</div>
              ) : (
                <div className="space-y-3">
                  {allStudents.map((student) => (
                    <div 
                      key={student.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{student.student_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {student.roll_number} • {student.department}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={student.is_profile_complete ? "default" : "secondary"}>
                          {student.is_profile_complete ? "Complete" : "Incomplete"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchStudentById(student.id)}
                          disabled={loadingStudent}
                        >
                          <User className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pagination && (
                    <div className="text-sm text-muted-foreground text-center">
                      Showing {allStudents.length} of {pagination.total} students
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Example 2: Filtered by Department */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Computer Science Students
            </CardTitle>
            <CardDescription>
              Filter students by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <code className="text-sm">
                  {`useStudents({ department: 'Computer Science and Engineering', limit: 3 })`}
                </code>
              </div>
              
              {loadingCS ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : errorCS ? (
                <div className="text-red-600 text-sm">{errorCS}</div>
              ) : (
                <div className="space-y-2">
                  {csStudents.map((student) => (
                    <div key={student.id} className="flex items-center gap-3 p-2 bg-blue-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{student.student_name}</div>
                        <div className="text-xs text-muted-foreground">{student.roll_number}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">CS</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Example 3: Profile Status Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Incomplete Profiles
            </CardTitle>
            <CardDescription>
              Filter by profile completion status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <code className="text-sm">
                  {`useStudents({ profileComplete: false, limit: 3 })`}
                </code>
              </div>
              
              {loadingIncomplete ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : errorIncomplete ? (
                <div className="text-red-600 text-sm">{errorIncomplete}</div>
              ) : (
                <div className="space-y-2">
                  {incompleteProfiles.map((student) => (
                    <div key={student.id} className="flex items-center gap-3 p-2 bg-yellow-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{student.student_name}</div>
                        <div className="text-xs text-muted-foreground">{student.roll_number}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs">Incomplete</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Example 4: Individual Student Detail */}
        {selectedStudent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Details
              </CardTitle>
              <CardDescription>
                Individual student fetched by ID: {selectedStudentId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <code className="text-sm">
                    {`myJkknApi.getStudentById('${selectedStudentId}')`}
                  </code>
                </div>
                
                {loadingStudent ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Name</div>
                      <div className="text-lg font-semibold">{selectedStudent.student_name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Roll Number</div>
                      <div className="text-lg font-semibold">{selectedStudent.roll_number}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Institution</div>
                      <div className="text-sm">{selectedStudent.institution}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Department</div>
                      <div className="text-sm">{selectedStudent.department}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm font-medium text-muted-foreground">Program</div>
                      <div className="text-sm">{selectedStudent.program}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Profile Status</div>
                      <Badge variant={selectedStudent.is_profile_complete ? "default" : "secondary"}>
                        {selectedStudent.is_profile_complete ? "Complete" : "Incomplete"}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 