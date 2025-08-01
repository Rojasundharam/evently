import { supabase } from '@/lib/supabase'

interface TableColumn {
  column_name: string;
  data_type: string;
}

/**
 * Ensures all necessary database objects exist
 * This includes views and other objects that may be missing
 */
export async function ensureDatabaseObjects() {
  try {
    console.log('Checking for required database objects...')
    
    // First, let's inspect the actual service_requests table to understand its structure
    try {
      const { data: columns, error: columnsError } = await supabase.rpc('get_service_requests_columns')
      
      if (!columnsError && columns) {
        console.log('Service Requests Table Columns:')
        columns.forEach((col: TableColumn) => {
          console.log(`- ${col.column_name} (${col.data_type})`)
        })
      }
    } catch (error) {
      console.log('Could not inspect table columns:', error)
    }
    
    // Check if the service_requests_view exists
    const { data: viewExists, error: viewCheckError } = await supabase.rpc(
      'check_if_view_exists',
      { view_name: 'service_requests_view' }
    )
    
    if (viewCheckError) {
      console.log('View check error:', viewCheckError.message)
    } else {
      console.log('Service requests view exists:', viewExists)
    }
    
    // Only try to create the view if the check was successful and view doesn't exist
    if (!viewCheckError && !viewExists) {
      try {
        await createServiceRequestsView()
        console.log('View created successfully')
      } catch (error) {
        console.error('Error creating view:', error)
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error ensuring database objects:', error)
    return { success: false, error }
  }
}

/**
 * Creates the service_requests_view if it doesn't exist
 */
async function createServiceRequestsView() {
  console.log('Creating service_requests_view...')
  
  // Try to create the view using our dynamic column detection function
  const { error } = await supabase.rpc('create_service_requests_view')
  
  if (error) {
    console.error('Error creating view through RPC:', error.message)
    
    // If that failed, we need to know the actual column names to create the view
    const { data: serviceRequestData, error: schemaError } = await supabase
      .from('service_requests')
      .select('*')
      .limit(1)
    
    if (schemaError) {
      throw new Error(`Cannot determine schema: ${schemaError.message}`)
    }
    
    if (serviceRequestData && serviceRequestData.length > 0) {
      // Get the keys from the first row to see actual column names
      const columns = Object.keys(serviceRequestData[0])
      console.log('Detected columns:', columns)
      
      // Find service_id and requester_id equivalent columns
      const serviceIdCol = columns.find(c => 
        c === 'service_id' || c.includes('service') && c.includes('id')
      )
      
      const requesterIdCol = columns.find(c => 
        c === 'requester_id' || c === 'user_id' || (c.includes('user') && c.includes('id'))
      )
      
      if (!serviceIdCol || !requesterIdCol) {
        throw new Error('Could not identify service_id or requester_id columns in the table')
      }
      
      console.log(`Using columns: service=${serviceIdCol}, requester=${requesterIdCol}`)
      
      // Create SQL with the detected column names
      const createViewSQL = `
      CREATE OR REPLACE VIEW service_requests_view AS
      SELECT
        sr.id,
        sr.${serviceIdCol} AS service_id,
        s.name AS service_name,
        sr.${requesterIdCol} AS requester_id,
        p.full_name AS requester_name,
        sr.status,
        sr.level,
        sr.max_approval_level,
        sr.created_at,
        sr.updated_at
      FROM
        service_requests sr
      LEFT JOIN
        services s ON sr.${serviceIdCol} = s.id
      LEFT JOIN
        profiles p ON sr.${requesterIdCol} = p.id
      `
      
      // Execute the SQL to create the view
      const { error: sqlError } = await supabase.rpc('exec_sql', { 
        sql: createViewSQL 
      })
      
      if (sqlError) {
        throw new Error(`Failed to create view: ${sqlError.message}`)
      }
    }
  }
} 