-- Creates a stored procedure that bypasses foreign key constraints to delete a category
-- *** USE WITH CAUTION - This will break referential integrity ***

CREATE OR REPLACE FUNCTION public.force_delete_category(category_id uuid)
RETURNS void AS $$
BEGIN
  -- Start an explicit transaction
  BEGIN
    -- Temporarily disable foreign key constraints for this transaction
    SET CONSTRAINTS ALL DEFERRED;
    
    -- First set all services using this category to NULL
    UPDATE public.services
    SET category_id = NULL
    WHERE category_id = force_delete_category.category_id;
    
    -- Then delete the category
    DELETE FROM public.service_categories
    WHERE id = force_delete_category.category_id;
    
    -- Reset constraints mode before committing
    SET CONSTRAINTS ALL IMMEDIATE;
    
    -- Commit the transaction
    COMMIT;
  EXCEPTION WHEN OTHERS THEN
    -- Reset constraints in case of error
    SET CONSTRAINTS ALL IMMEDIATE;
    
    -- Rollback in case of any error
    ROLLBACK;
    RAISE EXCEPTION 'Error deleting category: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 