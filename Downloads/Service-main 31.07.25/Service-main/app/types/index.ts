export interface Service {
  id: string;
  category: string;
  request_number: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  applicable_to: string;
}

export interface ServiceCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  created_at: string;
} 