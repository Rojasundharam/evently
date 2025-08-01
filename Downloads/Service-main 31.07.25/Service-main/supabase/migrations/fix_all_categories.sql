-- First, fix any orphaned services by setting their category_id to NULL
UPDATE public.services
SET category_id = NULL
WHERE category_id IN (
  SELECT id FROM public.service_categories WHERE name = 'BONAFIED CERTIFICATE REQUEST'
);

-- Then delete all problematic categories
DELETE FROM public.service_categories
WHERE name = 'BONAFIED CERTIFICATE REQUEST';

-- For any other problematic categories
DELETE FROM public.service_categories 
WHERE id = 'b4d8a640-2bf9-41b7-9937-8339006d1142'; 