import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next/types';

export const metadata: Metadata = {
  title: 'Service Details',
  description: 'View service details',
};

export default async function ServicePage({
  params,
}: {
  params: { id: string };
}) {
  
  // Get service with its category
  const { data: service, error } = await supabase
    .from('services')
    .select('*, service_categories(id, name, code)')
    .eq('id', params.id)
    .single();

  // Use notFound() for non-existent services
  if (error?.code === 'PGRST116' || !service) {
    notFound();
  }

  // Handle other errors with error UI
  if (error) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-end mb-6">
            <Link
              href="/services"
              className="px-4 py-2 bg-white border border-gray-200 rounded-md flex items-center text-sm text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to services
            </Link>
          </div>
          
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h1 className="text-lg font-medium">Error loading service</h1>
              <p>An error occurred while loading the service. Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Define status color based on service status
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] w-full pb-6">
      {/* Top navigation */}
      <div className="flex justify-end p-4 mb-6">
        <div className="flex gap-3">
          <Link 
            href="/services" 
            className="px-4 py-2 bg-white border border-gray-200 rounded-md flex items-center text-sm text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to services
          </Link>
          <Link
            href={`/services/edit/${service.id}`}
            className="px-4 py-2 bg-green-800 text-white rounded-md flex items-center text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Service
          </Link>
        </div>
      </div>

      <div className="w-full px-8">
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{service.name}</h1>
          <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
            {service.status}
          </span>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
          {/* Service Details Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start">
              <div className="text-gray-400 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-700 mb-2">Description</h2>
                <p className="text-gray-800">
                  {service.description || "No description provided"}
                </p>
              </div>
            </div>
          </div>
          
          {/* Category Details Section */}
          {service.service_categories && (
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start">
                <div className="text-gray-400 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Category</h2>
                  <div className="flex items-center">
                    <Link href={`/service-categories/view/${service.service_categories.id}`}>
                      <span className="px-3 py-1 bg-gray-100 rounded text-sm font-mono text-gray-800 hover:bg-gray-200 transition-colors">
                        {service.service_categories.code}
                      </span>
                      <span className="ml-2 text-green-800 hover:underline">
                        {service.service_categories.name}
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Timestamps Section */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <div className="text-gray-400 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Created At</h3>
                  <p className="text-gray-800">
                    {new Date(service.created_at).toLocaleDateString()} {new Date(service.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="text-gray-400 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Last Updated</h3>
                  <p className="text-gray-800">
                    {new Date(service.updated_at).toLocaleDateString()} {new Date(service.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional details section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Additional Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Add additional service fields here */}
              {service.price && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Price</h3>
                  <p className="text-gray-800">${service.price}</p>
                </div>
              )}
              {service.duration && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Duration</h3>
                  <p className="text-gray-800">{service.duration} minutes</p>
                </div>
              )}
              {/* Add more fields as needed */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}