/**
 * MyJKKN User Verification Service
 * Verifies if a logged-in user exists in MyJKKN's staff or student lists
 */

import { myJKKNApi } from './myjkkn-api';
import type { StaffData, StudentData, PaginatedResponse } from './myjkkn-api';

export interface UserVerificationResult {
  isValid: boolean;
  userType: 'staff' | 'student' | null;
  userData: StaffData | StudentData | null;
  error?: string;
}

export interface VerificationCache {
  email: string;
  result: UserVerificationResult;
  timestamp: number;
  expiresAt: number;
}

class MyJKKNUserVerificationService {
  private cache: Map<string, VerificationCache> = new Map();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_PAGES_TO_SEARCH = 10; // Limit search to prevent infinite loops

  /**
   * Verify if a user exists in MyJKKN staff or student lists
   */
  async verifyUser(email: string): Promise<UserVerificationResult> {
    try {
      // Check cache first
      const cached = this.getCachedResult(email);
      if (cached) {
        console.log(`🔍 Using cached verification result for ${email}`);
        return cached.result;
      }

      console.log(`🔍 Verifying user: ${email}`);

      // Search in both staff and student lists
      const [staffResult, studentResult] = await Promise.allSettled([
        this.searchInStaff(email),
        this.searchInStudents(email)
      ]);

      let verificationResult: UserVerificationResult;

      // Check staff results
      if (staffResult.status === 'fulfilled' && staffResult.value.isValid) {
        verificationResult = staffResult.value;
      }
      // Check student results if staff not found
      else if (studentResult.status === 'fulfilled' && studentResult.value.isValid) {
        verificationResult = studentResult.value;
      }
      // Neither found or both failed
      else {
        const staffError = staffResult.status === 'rejected' ? staffResult.reason : null;
        const studentError = studentResult.status === 'rejected' ? studentResult.reason : null;
        
        verificationResult = {
          isValid: false,
          userType: null,
          userData: null,
          error: `User not found in MyJKKN staff or student lists. ${staffError || studentError ? `Errors: ${staffError}, ${studentError}` : ''}`
        };
      }

      // Cache the result
      this.cacheResult(email, verificationResult);

      return verificationResult;
    } catch (error) {
      console.error('🚨 User verification failed:', error);
      return {
        isValid: false,
        userType: null,
        userData: null,
        error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Search for user in staff list
   */
  private async searchInStaff(email: string): Promise<UserVerificationResult> {
    console.log(`🔍 Searching staff for: ${email}`);
    
    let page = 1;
    
    while (page <= this.MAX_PAGES_TO_SEARCH) {
      try {
        const response = await myJKKNApi.getStaff(page, 50); // Get 50 per page for efficiency
        
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch staff data');
        }

        const staffList = response.data.data;
        
        // Search for user by email or institution_email
        const foundStaff = staffList.find(staff => 
          staff.email?.toLowerCase() === email.toLowerCase() ||
          staff.institution_email?.toLowerCase() === email.toLowerCase()
        );

        if (foundStaff) {
          console.log(`✅ Found staff member: ${foundStaff.first_name} ${foundStaff.last_name}`);
          return {
            isValid: true,
            userType: 'staff',
            userData: foundStaff
          };
        }

        // If we've reached the last page, stop searching
        if (page >= response.data.metadata.totalPages) {
          break;
        }

        page++;
      } catch (error) {
        console.error(`❌ Error searching staff page ${page}:`, error);
        throw error;
      }
    }

    return {
      isValid: false,
      userType: null,
      userData: null,
      error: 'Not found in staff list'
    };
  }

  /**
   * Search for user in student list
   */
  private async searchInStudents(email: string): Promise<UserVerificationResult> {
    console.log(`🔍 Searching students for: ${email}`);
    
    // Note: Student data might not have email field in the current API
    // We'll search by name patterns and roll number if email is not available
    
    let page = 1;
    
    while (page <= this.MAX_PAGES_TO_SEARCH) {
      try {
        const response = await myJKKNApi.getStudents(page, 50); // Get 50 per page for efficiency
        
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch student data');
        }

        const studentList = response.data.data;
        
        // Search for user by email (if available) or by extracting from roll number/name
        const foundStudent = studentList.find(student => {
          // If student has email field, check it
          if ((student as any).email) {
            return (student as any).email.toLowerCase() === email.toLowerCase();
          }
          
          // Alternative: Check if email matches pattern from roll number or name
          // This is a fallback for cases where email is not directly available
          const emailPrefix = email.split('@')[0].toLowerCase();
          return (
            student.roll_number?.toLowerCase().includes(emailPrefix) ||
            student.student_name?.toLowerCase().replace(/\s+/g, '').includes(emailPrefix)
          );
        });

        if (foundStudent) {
          console.log(`✅ Found student: ${foundStudent.student_name} (${foundStudent.roll_number})`);
          return {
            isValid: true,
            userType: 'student',
            userData: foundStudent
          };
        }

        // If we've reached the last page, stop searching
        if (page >= response.data.metadata.totalPages) {
          break;
        }

        page++;
      } catch (error) {
        console.error(`❌ Error searching students page ${page}:`, error);
        throw error;
      }
    }

    return {
      isValid: false,
      userType: null,
      userData: null,
      error: 'Not found in student list'
    };
  }

  /**
   * Search user by specific criteria (more targeted search)
   */
  async searchUserByName(fullName: string): Promise<UserVerificationResult> {
    try {
      console.log(`🔍 Searching by name: ${fullName}`);

      // Search staff by name
      const staffResponse = await myJKKNApi.searchStaff(fullName, 1, 20);
      if (staffResponse.success && staffResponse.data?.data.length > 0) {
        const staff = staffResponse.data.data[0];
        return {
          isValid: true,
          userType: 'staff',
          userData: staff
        };
      }

      // Search students by name
      const studentResponse = await myJKKNApi.searchStudents(fullName, 1, 20);
      if (studentResponse.success && studentResponse.data?.data.length > 0) {
        const student = studentResponse.data.data[0];
        return {
          isValid: true,
          userType: 'student',
          userData: student
        };
      }

      return {
        isValid: false,
        userType: null,
        userData: null,
        error: 'User not found by name'
      };
    } catch (error) {
      return {
        isValid: false,
        userType: null,
        userData: null,
        error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get cached verification result
   */
  private getCachedResult(email: string): VerificationCache | null {
    const cached = this.cache.get(email.toLowerCase());
    
    if (cached && Date.now() < cached.expiresAt) {
      return cached;
    }
    
    // Remove expired cache
    if (cached) {
      this.cache.delete(email.toLowerCase());
    }
    
    return null;
  }

  /**
   * Cache verification result
   */
  private cacheResult(email: string, result: UserVerificationResult): void {
    const now = Date.now();
    this.cache.set(email.toLowerCase(), {
      email: email.toLowerCase(),
      result,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION
    });

    // Clean up old cache entries periodically
    this.cleanupCache();
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [email, cache] of this.cache.entries()) {
      if (now >= cache.expiresAt) {
        this.cache.delete(email);
      }
    }
  }

  /**
   * Clear all cached results
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.values()).map(cache => ({
        email: cache.email,
        isValid: cache.result.isValid,
        userType: cache.result.userType,
        timestamp: new Date(cache.timestamp).toISOString(),
        expiresAt: new Date(cache.expiresAt).toISOString()
      }))
    };
  }

  /**
   * Batch verify multiple users
   */
  async verifyMultipleUsers(emails: string[]): Promise<Map<string, UserVerificationResult>> {
    const results = new Map<string, UserVerificationResult>();
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (email) => {
        const result = await this.verifyUser(email);
        return { email, result };
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((promiseResult) => {
        if (promiseResult.status === 'fulfilled') {
          results.set(promiseResult.value.email, promiseResult.value.result);
        } else {
          results.set('unknown', {
            isValid: false,
            userType: null,
            userData: null,
            error: 'Batch verification failed'
          });
        }
      });

      // Add delay between batches to be respectful to the API
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

// Export singleton instance
export const myJKKNUserVerification = new MyJKKNUserVerificationService();

// Export types
export type { StaffData, StudentData }; 