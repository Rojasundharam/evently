import { supabase } from '@/lib/supabase';

export interface TableStatus {
  tableName: string;
  exists: boolean;
  error?: string;
}

export class DatabaseSetup {
  /**
   * Check if required tables exist
   */
  static async checkRequiredTables(): Promise<TableStatus[]> {
    const requiredTables = [
      'notifications',
      'notification_preferences', 
      'file_metadata',
      'service_requests',
      'services',
      'service_categories',
      'profiles'
    ];

    const results: TableStatus[] = [];

    for (const tableName of requiredTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .limit(1);

        if (error) {
          if (error.message.includes('does not exist') || error.message.includes('relation') || error.code === 'PGRST116') {
            results.push({
              tableName,
              exists: false,
              error: `Table '${tableName}' does not exist`
            });
          } else {
            results.push({
              tableName,
              exists: true,
              error: `Table exists but has access issues: ${error.message}`
            });
          }
        } else {
          results.push({
            tableName,
            exists: true
          });
        }
      } catch (error) {
        results.push({
          tableName,
          exists: false,
          error: `Error checking table: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    return results;
  }

  /**
   * Get database setup status for UI display
   */
  static async getDatabaseStatus(): Promise<{
    isReady: boolean;
    missingTables: string[];
    issues: string[];
    recommendations: string[];
  }> {
    const tableStatuses = await this.checkRequiredTables();
    
    const missingTables = tableStatuses
      .filter(status => !status.exists)
      .map(status => status.tableName);

    const issues = tableStatuses
      .filter(status => status.error)
      .map(status => status.error!);

    const recommendations: string[] = [];

    if (missingTables.length > 0) {
      recommendations.push(
        'Run database migrations to create missing tables:\n' +
        '1. Open Supabase Dashboard\n' +
        '2. Go to SQL Editor\n' +
        '3. Run the migration files in /supabase/migrations/ folder'
      );
    }

    return {
      isReady: missingTables.length === 0 && issues.length === 0,
      missingTables,
      issues,
      recommendations
    };
  }

  /**
   * Log database status to console for debugging
   */
  static async logDatabaseStatus(): Promise<void> {
    console.log('🔍 Checking database setup...');
    
    const status = await this.getDatabaseStatus();
    
    if (status.isReady) {
      console.log('✅ Database is ready - All required tables exist');
    } else {
      console.warn('⚠️ Database setup incomplete');
      
      if (status.missingTables.length > 0) {
        console.warn('Missing tables:', status.missingTables.join(', '));
      }
      
      if (status.issues.length > 0) {
        console.warn('Issues found:', status.issues.join('; '));
      }
      
      if (status.recommendations.length > 0) {
        console.warn('Recommendations:');
        status.recommendations.forEach(rec => console.warn(`- ${rec}`));
      }
    }
  }
}

export default DatabaseSetup; 