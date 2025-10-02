-- Quick fix for policy conflicts
-- Run this first to drop existing policies, then run the main migration

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to view trains" ON public.trains;
DROP POLICY IF EXISTS "Allow authenticated users to insert trains" ON public.trains;
DROP POLICY IF EXISTS "Allow authenticated users to update trains" ON public.trains;
DROP POLICY IF EXISTS "Allow authenticated users to delete trains" ON public.trains;

DROP POLICY IF EXISTS "Allow authenticated users to view csv_data_sources" ON public.csv_data_sources;
DROP POLICY IF EXISTS "Allow authenticated users to insert csv_data_sources" ON public.csv_data_sources;
DROP POLICY IF EXISTS "Allow authenticated users to update csv_data_sources" ON public.csv_data_sources;

DROP POLICY IF EXISTS "Users can view their own csv_uploads" ON public.csv_uploads;
DROP POLICY IF EXISTS "Users can insert their own csv_uploads" ON public.csv_uploads;
DROP POLICY IF EXISTS "Users can update their own csv_uploads" ON public.csv_uploads;
DROP POLICY IF EXISTS "Users can delete their own csv_uploads" ON public.csv_uploads;

DROP POLICY IF EXISTS "Users can view csv_data_rows from their uploads" ON public.csv_data_rows;
DROP POLICY IF EXISTS "Users can insert csv_data_rows for their uploads" ON public.csv_data_rows;

DROP POLICY IF EXISTS "Users can view their own ml_models" ON public.ml_models;
DROP POLICY IF EXISTS "Users can insert their own ml_models" ON public.ml_models;
DROP POLICY IF EXISTS "Users can update their own ml_models" ON public.ml_models;
DROP POLICY IF EXISTS "Users can delete their own ml_models" ON public.ml_models;

DROP POLICY IF EXISTS "Users can view their own ml_training_sessions" ON public.ml_training_sessions;
DROP POLICY IF EXISTS "Users can insert their own ml_training_sessions" ON public.ml_training_sessions;
DROP POLICY IF EXISTS "Users can update their own ml_training_sessions" ON public.ml_training_sessions;

DROP POLICY IF EXISTS "Users can view ml_training_data_sources for their sessions" ON public.ml_training_data_sources;
DROP POLICY IF EXISTS "Users can insert ml_training_data_sources for their sessions" ON public.ml_training_data_sources;

DROP POLICY IF EXISTS "Users can view manual_overrides" ON public.manual_overrides;
DROP POLICY IF EXISTS "Supervisors can insert manual_overrides" ON public.manual_overrides;
DROP POLICY IF EXISTS "Supervisors can update their own manual_overrides" ON public.manual_overrides;

DROP POLICY IF EXISTS "Users can view daily_induction_runs" ON public.daily_induction_runs;
DROP POLICY IF EXISTS "System can insert daily_induction_runs" ON public.daily_induction_runs;
DROP POLICY IF EXISTS "Users can update daily_induction_runs" ON public.daily_induction_runs;





