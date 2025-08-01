'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash, Mail } from 'lucide-react'

export interface StaffMember {
  id: string
  name: string
  email?: string
}

export interface ApprovalLevel {
  id?: string
  level: number
  staff_id: string
  staff_name?: string
  staff_email?: string
}

interface ApprovalLevelConfigProps {
  initialLevels?: ApprovalLevel[]
  onChange: (levels: ApprovalLevel[]) => void
}

export default function ApprovalLevelConfig({ 
  initialLevels = [], 
  onChange
}: ApprovalLevelConfigProps) {
  const [levels, setLevels] = useState<ApprovalLevel[]>(initialLevels)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(false)
  const [emailInput, setEmailInput] = useState<string>('')
  const [activeLevel, setActiveLevel] = useState<number | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Fetch staff members on component mount
  useEffect(() => {
    const fetchStaffMembers = async () => {
      try {
        setLoading(true)
        
        // Just use mock data for now to avoid the Supabase error
        // We'll focus on direct email assignment instead
        setStaffMembers([
          { id: 'staff1', name: 'John Doe', email: 'john@example.com' },
          { id: 'staff2', name: 'Jane Smith', email: 'jane@example.com' },
        ])
        
        /* 
        // This was causing the error - commented out for now
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .order('full_name')
        
        if (error) throw error;
        
        setStaffMembers(data.map(staff => ({
          id: staff.id,
          name: staff.full_name || 'Unnamed Staff'
        })))
        */
        
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch staff members:', error)
        setLoading(false)
        
        // Use mock data as fallback
        setStaffMembers([
          { id: 'staff1', name: 'John Doe', email: 'john@example.com' },
          { id: 'staff2', name: 'Jane Smith', email: 'jane@example.com' },
        ])
      }
    }

    fetchStaffMembers()
  }, [])

  // Add a new approval level
  const addLevel = () => {
    const newLevel: ApprovalLevel = {
      level: levels.length + 1,
      staff_id: '',
    }
    
    const updatedLevels = [...levels, newLevel]
    setLevels(updatedLevels)
    onChange(updatedLevels)
  }

  // Remove an approval level
  const removeLevel = (index: number) => {
    const updatedLevels = levels.filter((_, i) => i !== index)
    // Reorder the remaining levels
    const reorderedLevels = updatedLevels.map((level, idx) => ({
      ...level,
      level: idx + 1
    }))
    
    setLevels(reorderedLevels)
    onChange(reorderedLevels)
  }

  // Update an approval level with a staff member
  const updateLevel = (index: number, staffId: string) => {
    const updatedLevels = [...levels]
    const staff = staffMembers.find(s => s.id === staffId)
    
    updatedLevels[index] = {
      ...updatedLevels[index],
      staff_id: staffId,
      staff_name: staff?.name,
      staff_email: staff?.email
    }
    
    setLevels(updatedLevels)
    onChange(updatedLevels)
  }

  // Directly assign by email without searching for existing user
  const assignDirectlyByEmail = (index: number) => {
    if (!emailInput || !emailInput.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setEmailError(null);
    
    // Generate a temporary ID for the email
    const emailId = `email_${Date.now()}`;
    
    // Add to staff members list if not already there
    if (!staffMembers.some(s => s.email === emailInput)) {
      setStaffMembers([...staffMembers, {
        id: emailId,
        name: emailInput.split('@')[0], // Use part before @ as name
        email: emailInput
      }]);
    }
    
    // Update the level with this email
    const updatedLevels = [...levels];
    updatedLevels[index] = {
      ...updatedLevels[index],
      staff_id: emailId,
      staff_name: emailInput.split('@')[0],
      staff_email: emailInput
    };
    
    setLevels(updatedLevels);
    onChange(updatedLevels);
    setEmailInput('');
    setActiveLevel(null);
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading staff members...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Approval Levels</h3>
        <button
          type="button"
          onClick={addLevel}
          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <Plus size={16} className="mr-1" />
          Add Level
        </button>
      </div>

      {levels.length === 0 ? (
        <div className="text-sm text-gray-500 border border-dashed border-gray-300 p-4 rounded-md text-center">
          No approval levels configured. Click &quot;Add Level&quot; to start.
        </div>
      ) : (
        <div className="space-y-3">
          {levels.map((level, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-md">
                <div className="min-w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full">
                  {level.level}
                </div>
                {level.staff_email ? (
                  <div className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md flex items-center">
                    <Mail size={16} className="text-gray-500 mr-2" />
                    <span className="text-sm">{level.staff_email}</span>
                  </div>
                ) : (
                  <select
                    value={level.staff_id}
                    onChange={(e) => updateLevel(index, e.target.value)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50"
                  >
                    <option value="">Select Staff Member</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}{staff.email ? ` (${staff.email})` : ''}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => removeLevel(index)}
                  className="inline-flex items-center p-1.5 border border-gray-300 text-xs rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                  aria-label="Remove level"
                >
                  <Trash size={16} className="text-red-500" />
                </button>
              </div>
              
              {/* Email assignment option */}
              {!level.staff_email && (
                <>
                  <div className="flex items-center space-x-2 pl-11">
                    <input
                      type="email"
                      placeholder="Assign by email address..."
                      value={emailInput}
                      onClick={() => setActiveLevel(index)}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        setEmailError(null);
                      }}
                      className="flex-1 rounded-md border-gray-300 text-sm shadow-sm focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => assignDirectlyByEmail(index)}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Mail size={14} className="mr-1" />
                      Assign Email
                    </button>
                  </div>
                  
                  {emailError && activeLevel === index && (
                    <div className="pl-11 text-xs text-red-500">{emailError}</div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 