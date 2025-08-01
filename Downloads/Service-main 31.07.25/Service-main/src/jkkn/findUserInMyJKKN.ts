/**
 * MyJKKN User Verification Service
 * Searches for users in MyJKKN staff and student lists
 */

import axios, { AxiosInstance } from 'axios';

interface MyJKKNUser {
  email?: string;
  institution_email?: string;
  [key: string]: any;
}

interface MyJKKNResponse {
  data: MyJKKNUser[];
  metadata: {
    page: number;
    totalPages: number;
    total: number;
  };
}

interface MyJKKNConfig {
  baseUrl: string;
  apiKey?: string;
  pageSize: number;
  maxPages: number;
  timeout: number;
  retries: number;
}

class MyJKKNClient {
  private client: AxiosInstance;
  private config: MyJKKNConfig;

  constructor(config: MyJKKNConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    });

    // Add retry interceptor
    this.setupRetryInterceptor();
  }

  private setupRetryInterceptor() {
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        
        if (!config._retryCount) {
          config._retryCount = 0;
        }

        if (config._retryCount < this.config.retries) {
          config._retryCount++;
          
          // Exponential backoff
          const delay = Math.pow(2, config._retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.client(config);
        }

        return Promise.reject(error);
      }
    );
  }

  async fetchStaffPage(page: number): Promise<MyJKKNResponse> {
    const response = await this.client.get('/api-management/staff', {
      params: {
        page,
        limit: this.config.pageSize
      }
    });
    return response.data;
  }

  async fetchStudentPage(page: number): Promise<MyJKKNResponse> {
    const response = await this.client.get('/api-management/students', {
      params: {
        page,
        limit: this.config.pageSize
      }
    });
    return response.data;
  }
}

/**
 * Search for a user in a list of MyJKKN users
 */
function searchUserInList(users: MyJKKNUser[], email: string): boolean {
  const searchEmail = email.toLowerCase().trim();
  
  return users.some(user => {
    const userEmail = user.email?.toLowerCase().trim();
    const institutionEmail = user.institution_email?.toLowerCase().trim();
    
    return userEmail === searchEmail || institutionEmail === searchEmail;
  });
}

/**
 * Search for user in staff list with pagination
 */
async function searchInStaff(client: MyJKKNClient, email: string): Promise<boolean> {
  let page = 1;
  
  while (page <= client['config'].maxPages) {
    try {
      const response = await client.fetchStaffPage(page);
      
      // Search in current page
      if (searchUserInList(response.data, email)) {
        return true;
      }
      
      // Check if we've reached the end
      if (page >= response.metadata.totalPages) {
        break;
      }
      
      page++;
    } catch (error) {
      // Log error but continue to next page
      console.error(`Error fetching staff page ${page}:`, error);
      page++;
    }
  }
  
  return false;
}

/**
 * Search for user in student list with pagination
 */
async function searchInStudents(client: MyJKKNClient, email: string): Promise<boolean> {
  let page = 1;
  
  while (page <= client['config'].maxPages) {
    try {
      const response = await client.fetchStudentPage(page);
      
      // Search in current page
      if (searchUserInList(response.data, email)) {
        return true;
      }
      
      // Check if we've reached the end
      if (page >= response.metadata.totalPages) {
        break;
      }
      
      page++;
    } catch (error) {
      // Log error but continue to next page
      console.error(`Error fetching student page ${page}:`, error);
      page++;
    }
  }
  
  return false;
}

/**
 * Find user in MyJKKN staff or student lists
 * @param email - User email to search for
 * @returns Promise<boolean> - true if user found, false otherwise
 */
export async function findUserInMyJKKN(email: string): Promise<boolean> {
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required and must be a string');
  }

  const config: MyJKKNConfig = {
    baseUrl: process.env.MYJKKN_BASE || 'https://myadmin.jkkn.ac.in',
    apiKey: process.env.MYJKKN_API_KEY,
    pageSize: parseInt(process.env.JKKN_PAGE_SIZE || '20'),
    maxPages: parseInt(process.env.JKKN_MAX_PAGES || '150'),
    timeout: 7000, // 7 seconds
    retries: 3
  };

  const client = new MyJKKNClient(config);

  try {
    // Search in parallel for better performance
    const [foundInStaff, foundInStudents] = await Promise.all([
      searchInStaff(client, email),
      searchInStudents(client, email)
    ]);

    return foundInStaff || foundInStudents;
  } catch (error) {
    console.error('Error searching MyJKKN:', error);
    throw new Error('Failed to verify user in MyJKKN system');
  }
}

// Export types for testing
export type { MyJKKNUser, MyJKKNResponse, MyJKKNConfig }; 