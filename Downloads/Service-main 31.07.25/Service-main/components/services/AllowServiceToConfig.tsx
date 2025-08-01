'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, X, Users, Settings } from 'lucide-react'
import { usePrograms } from '@/hooks/usePrograms'

export interface ServiceProgramConfig {
  id: string
  program_id: string
  program_name: string
  admission_year: string
  intake: string
  status: 'active' | 'inactive'
}

interface AllowServiceToConfigProps {
  initialValue?: 'all' | 'program_specific'
  initialProgramConfigs?: ServiceProgramConfig[]
  onChange?: (type: 'all' | 'program_specific', configs: ServiceProgramConfig[]) => void
  className?: string
}

const ADMISSION_YEARS = [
  '2020-2021',
  '2021-2022', 
  '2022-2023',
  '2023-2024',
  '2024-2025',
  '2025-2026'
]

const INTAKE_OPTIONS = [
  'First Intake',
  'Second Intake', 
  'Third Intake',
  'Management Quota',
  'Government Quota',
  'NRI Quota'
]

interface ProgramData {
  id: string
  program_name: string
  is_active: boolean
}

export default function AllowServiceToConfig({ 
  initialValue = 'all',
  initialProgramConfigs = [],
  onChange,
  className 
}: AllowServiceToConfigProps) {
  const [serviceType, setServiceType] = useState<'all' | 'program_specific'>(initialValue)
  const [programConfigs, setProgramConfigs] = useState<ServiceProgramConfig[]>(initialProgramConfigs)
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedIntake, setSelectedIntake] = useState<string>('')

  const { programs, loading: programsLoading, fetchPrograms, isApiConfigured } = usePrograms({
    autoFetch: true,
    pageSize: 100 // Get more programs for selection
  })

  useEffect(() => {
    if (isApiConfigured) {
      fetchPrograms()
    }
  }, [isApiConfigured, fetchPrograms])

  useEffect(() => {
    onChange?.(serviceType, programConfigs)
  }, [serviceType, programConfigs, onChange])

  const handleServiceTypeChange = (type: 'all' | 'program_specific') => {
    setServiceType(type)
    if (type === 'all') {
      setProgramConfigs([])
    }
  }

  const addProgramConfig = () => {
    if (!selectedProgram || !selectedYear || !selectedIntake) {
      return
    }

    const program = programs.find(p => p.id === selectedProgram)
    if (!program) return

    // Check if this combination already exists
    const exists = programConfigs.some(config => 
      config.program_id === selectedProgram && 
      config.admission_year === selectedYear &&
      config.intake === selectedIntake
    )

    if (exists) {
      alert('This program configuration already exists')
      return
    }

    const newConfig: ServiceProgramConfig = {
      id: `${selectedProgram}-${selectedYear}-${selectedIntake}-${Date.now()}`,
      program_id: selectedProgram,
      program_name: program.program_name,
      admission_year: selectedYear,
      intake: selectedIntake,
      status: 'active'
    }

    setProgramConfigs(prev => [...prev, newConfig])
    
    // Reset form
    setSelectedProgram('')
    setSelectedYear('')
    setSelectedIntake('')
  }

  const removeProgramConfig = (configId: string) => {
    setProgramConfigs(prev => prev.filter(config => config.id !== configId))
  }

  const toggleConfigStatus = (configId: string) => {
    setProgramConfigs(prev => prev.map(config => 
      config.id === configId 
        ? { ...config, status: config.status === 'active' ? 'inactive' : 'active' }
        : config
    ))
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Allow service to</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Service Type Selection */}
          <div className="space-y-4">
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="serviceType"
                  value="all"
                  checked={serviceType === 'all'}
                  onChange={() => handleServiceTypeChange('all')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">All</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="serviceType"
                  value="program_specific"
                  checked={serviceType === 'program_specific'}
                  onChange={() => handleServiceTypeChange('program_specific')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">Program specific</span>
              </label>
            </div>
          </div>

          {/* Program Specific Configuration */}
          {serviceType === 'program_specific' && (
            <div className="space-y-6">
              {!isApiConfigured ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-yellow-800">
                    <Settings className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      API configuration required to load programs. Please configure your MyJKKN API credentials first.
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Add Program Form */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">Add Program Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Program
                        </label>
                        <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>
                          <SelectContent>
                            {programsLoading ? (
                              <SelectItem value="_loading" disabled>Loading programs...</SelectItem>
                            ) : programs.length === 0 ? (
                              <SelectItem value="_empty" disabled>No programs available</SelectItem>
                            ) : (
                              programs
                                .filter((program: ProgramData) => program.is_active)
                                .map((program: ProgramData) => (
                                  <SelectItem key={program.id} value={program.id}>
                                    {program.program_name}
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Admission Year
                        </label>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            {ADMISSION_YEARS.map((year) => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Intake
                        </label>
                        <Select value={selectedIntake} onValueChange={setSelectedIntake}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select intake" />
                          </SelectTrigger>
                          <SelectContent>
                            {INTAKE_OPTIONS.map((intake) => (
                              <SelectItem key={intake} value={intake}>
                                {intake}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          onClick={addProgramConfig}
                          disabled={!selectedProgram || !selectedYear || !selectedIntake}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Program Configurations Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Program</TableHead>
                          <TableHead>Admission Year</TableHead>
                          <TableHead>Intake</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {programConfigs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                              No program configurations added. Click &quot;Add&quot; to start.
                            </TableCell>
                          </TableRow>
                        ) : (
                          programConfigs.map((config) => (
                            <TableRow key={config.id}>
                              <TableCell className="font-medium">
                                <div className="max-w-xs truncate" title={config.program_name}>
                                  {config.program_name}
                                </div>
                              </TableCell>
                              <TableCell>{config.admission_year}</TableCell>
                              <TableCell>{config.intake}</TableCell>
                              <TableCell>
                                <button
                                  type="button"
                                  onClick={() => toggleConfigStatus(config.id)}
                                >
                                  <Badge 
                                    className={`cursor-pointer ${
                                      config.status === 'active' 
                                        ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                                        : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                                    }`}
                                  >
                                    {config.status === 'active' ? 'Active' : 'Inactive'}
                                  </Badge>
                                </button>
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeProgramConfig(config.id)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {programConfigs.length > 0 && (
                    <div className="text-sm text-gray-500">
                      {programConfigs.length} program configuration{programConfigs.length !== 1 ? 's' : ''} added
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 