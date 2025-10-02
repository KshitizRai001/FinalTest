-- Complete Supabase Migration Script
-- This script creates all tables and policies in the correct order
-- Safe to run multiple times (idempotent)

-- Create trains table
CREATE TABLE IF NOT EXISTS public.trains (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    train_id VARCHAR(10) UNIQUE NOT NULL,
    fc_rs BOOLEAN DEFAULT FALSE,
    fc_sig BOOLEAN DEFAULT FALSE,
    fc_tel BOOLEAN DEFAULT FALSE,
    open_jobs INTEGER DEFAULT 0,
    branding_shortfall INTEGER DEFAULT 0,
    mileage_km INTEGER DEFAULT 0,
    cleaning_due BOOLEAN DEFAULT FALSE,
    stabling_penalty INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CSV data sources table
CREATE TABLE IF NOT EXISTS public.csv_data_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CSV uploads table
CREATE TABLE IF NOT EXISTS public.csv_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id UUID REFERENCES public.csv_data_sources(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    row_count INTEGER NOT NULL,
    headers JSONB NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create CSV data rows table
CREATE TABLE IF NOT EXISTS public.csv_data_rows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    upload_id UUID REFERENCES public.csv_uploads(id) ON DELETE CASCADE,
    row_data JSONB NOT NULL,
    row_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ML models table
CREATE TABLE IF NOT EXISTS public.ml_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    model_type VARCHAR(50) NOT NULL,
    configuration JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create ML training sessions table
CREATE TABLE IF NOT EXISTS public.ml_training_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_id UUID REFERENCES public.ml_models(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('pending', 'training', 'completed', 'failed')) DEFAULT 'pending',
    metrics JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create junction table for ML training sessions and data sources
CREATE TABLE IF NOT EXISTS public.ml_training_data_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    training_session_id UUID REFERENCES public.ml_training_sessions(id) ON DELETE CASCADE,
    data_source_id UUID REFERENCES public.csv_data_sources(id) ON DELETE CASCADE,
    UNIQUE(training_session_id, data_source_id)
);

-- Create manual overrides table
CREATE TABLE IF NOT EXISTS public.manual_overrides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ranked_list JSONB NOT NULL,
    comment TEXT NOT NULL,
    supervisor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    supervisor_name VARCHAR(255) NOT NULL,
    original_list JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily induction runs table
CREATE TABLE IF NOT EXISTS public.daily_induction_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    run_date DATE NOT NULL,
    run_time TIME NOT NULL,
    service_window VARCHAR(50) NOT NULL,
    ready_trains INTEGER NOT NULL,
    standby_trains INTEGER NOT NULL,
    ibl_trains INTEGER NOT NULL,
    selected_trains JSONB NOT NULL,
    notes TEXT,
    auto_detected BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create schedule_results table for advanced scheduling
CREATE TABLE IF NOT EXISTS public.schedule_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    planning_date DATE NOT NULL UNIQUE,
    solver_status TEXT NOT NULL,
    total_trains_used INTEGER NOT NULL,
    trips_serviced INTEGER NOT NULL,
    trips_unserviced INTEGER DEFAULT 0,
    induction_ranking JSONB,
    trip_assignments JSONB,
    input_data JSONB,
    constraints_applied JSONB,
    audit_trail JSONB,
    constraint_weights JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trains_train_id ON public.trains(train_id);
CREATE INDEX IF NOT EXISTS idx_csv_uploads_source_id ON public.csv_uploads(source_id);
CREATE INDEX IF NOT EXISTS idx_csv_uploads_user_id ON public.csv_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_csv_data_rows_upload_id ON public.csv_data_rows(upload_id);
CREATE INDEX IF NOT EXISTS idx_csv_data_rows_row_index ON public.csv_data_rows(row_index);
CREATE INDEX IF NOT EXISTS idx_ml_models_user_id ON public.ml_models(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_models_is_active ON public.ml_models(is_active);
CREATE INDEX IF NOT EXISTS idx_ml_training_sessions_model_id ON public.ml_training_sessions(model_id);
CREATE INDEX IF NOT EXISTS idx_ml_training_sessions_user_id ON public.ml_training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_overrides_supervisor_id ON public.manual_overrides(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_manual_overrides_created_at ON public.manual_overrides(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_induction_runs_date ON public.daily_induction_runs(run_date);
CREATE INDEX IF NOT EXISTS idx_daily_induction_runs_auto_detected ON public.daily_induction_runs(auto_detected);

-- Enable Row Level Security (RLS)
ALTER TABLE public.trains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_data_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_training_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_induction_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_results ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS handle_trains_updated_at ON public.trains;
CREATE TRIGGER handle_trains_updated_at
    BEFORE UPDATE ON public.trains
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_csv_data_sources_updated_at ON public.csv_data_sources;
CREATE TRIGGER handle_csv_data_sources_updated_at
    BEFORE UPDATE ON public.csv_data_sources
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_ml_models_updated_at ON public.ml_models;
CREATE TRIGGER handle_ml_models_updated_at
    BEFORE UPDATE ON public.ml_models
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_manual_overrides_updated_at ON public.manual_overrides;
CREATE TRIGGER handle_manual_overrides_updated_at
    BEFORE UPDATE ON public.manual_overrides
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Now create/recreate all RLS policies (drop existing ones first to avoid conflicts)

-- Trains table policies
DROP POLICY IF EXISTS "Allow authenticated users to view trains" ON public.trains;
CREATE POLICY "Allow authenticated users to view trains" ON public.trains
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to insert trains" ON public.trains;
CREATE POLICY "Allow authenticated users to insert trains" ON public.trains
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to update trains" ON public.trains;
CREATE POLICY "Allow authenticated users to update trains" ON public.trains
    FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to delete trains" ON public.trains;
CREATE POLICY "Allow authenticated users to delete trains" ON public.trains
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- CSV data sources policies
DROP POLICY IF EXISTS "Allow authenticated users to view csv_data_sources" ON public.csv_data_sources;
CREATE POLICY "Allow authenticated users to view csv_data_sources" ON public.csv_data_sources
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to insert csv_data_sources" ON public.csv_data_sources;
CREATE POLICY "Allow authenticated users to insert csv_data_sources" ON public.csv_data_sources
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to update csv_data_sources" ON public.csv_data_sources;
CREATE POLICY "Allow authenticated users to update csv_data_sources" ON public.csv_data_sources
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- CSV uploads policies
DROP POLICY IF EXISTS "Users can view their own csv_uploads" ON public.csv_uploads;
CREATE POLICY "Users can view their own csv_uploads" ON public.csv_uploads
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own csv_uploads" ON public.csv_uploads;
CREATE POLICY "Users can insert their own csv_uploads" ON public.csv_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own csv_uploads" ON public.csv_uploads;
CREATE POLICY "Users can update their own csv_uploads" ON public.csv_uploads
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own csv_uploads" ON public.csv_uploads;
CREATE POLICY "Users can delete their own csv_uploads" ON public.csv_uploads
    FOR DELETE USING (auth.uid() = user_id);

-- CSV data rows policies
DROP POLICY IF EXISTS "Users can view csv_data_rows from their uploads" ON public.csv_data_rows;
CREATE POLICY "Users can view csv_data_rows from their uploads" ON public.csv_data_rows
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.csv_uploads 
            WHERE csv_uploads.id = csv_data_rows.upload_id 
            AND csv_uploads.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert csv_data_rows for their uploads" ON public.csv_data_rows;
CREATE POLICY "Users can insert csv_data_rows for their uploads" ON public.csv_data_rows
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.csv_uploads 
            WHERE csv_uploads.id = csv_data_rows.upload_id 
            AND csv_uploads.user_id = auth.uid()
        )
    );

-- ML models policies
DROP POLICY IF EXISTS "Users can view their own ml_models" ON public.ml_models;
CREATE POLICY "Users can view their own ml_models" ON public.ml_models
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own ml_models" ON public.ml_models;
CREATE POLICY "Users can insert their own ml_models" ON public.ml_models
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own ml_models" ON public.ml_models;
CREATE POLICY "Users can update their own ml_models" ON public.ml_models
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own ml_models" ON public.ml_models;
CREATE POLICY "Users can delete their own ml_models" ON public.ml_models
    FOR DELETE USING (auth.uid() = user_id);

-- ML training sessions policies
DROP POLICY IF EXISTS "Users can view their own ml_training_sessions" ON public.ml_training_sessions;
CREATE POLICY "Users can view their own ml_training_sessions" ON public.ml_training_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own ml_training_sessions" ON public.ml_training_sessions;
CREATE POLICY "Users can insert their own ml_training_sessions" ON public.ml_training_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own ml_training_sessions" ON public.ml_training_sessions;
CREATE POLICY "Users can update their own ml_training_sessions" ON public.ml_training_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- ML training data sources junction table policies
DROP POLICY IF EXISTS "Users can view ml_training_data_sources for their sessions" ON public.ml_training_data_sources;
CREATE POLICY "Users can view ml_training_data_sources for their sessions" ON public.ml_training_data_sources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ml_training_sessions 
            WHERE ml_training_sessions.id = ml_training_data_sources.training_session_id 
            AND ml_training_sessions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert ml_training_data_sources for their sessions" ON public.ml_training_data_sources;
CREATE POLICY "Users can insert ml_training_data_sources for their sessions" ON public.ml_training_data_sources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ml_training_sessions 
            WHERE ml_training_sessions.id = ml_training_data_sources.training_session_id 
            AND ml_training_sessions.user_id = auth.uid()
        )
    );

-- Manual overrides policies
DROP POLICY IF EXISTS "Users can view manual_overrides" ON public.manual_overrides;
CREATE POLICY "Users can view manual_overrides" ON public.manual_overrides
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Supervisors can insert manual_overrides" ON public.manual_overrides;
CREATE POLICY "Supervisors can insert manual_overrides" ON public.manual_overrides
    FOR INSERT WITH CHECK (auth.uid() = supervisor_id);

DROP POLICY IF EXISTS "Supervisors can update their own manual_overrides" ON public.manual_overrides;
CREATE POLICY "Supervisors can update their own manual_overrides" ON public.manual_overrides
    FOR UPDATE USING (auth.uid() = supervisor_id);

-- Daily induction runs policies
DROP POLICY IF EXISTS "Users can view daily_induction_runs" ON public.daily_induction_runs;
CREATE POLICY "Users can view daily_induction_runs" ON public.daily_induction_runs
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can insert daily_induction_runs" ON public.daily_induction_runs;
CREATE POLICY "System can insert daily_induction_runs" ON public.daily_induction_runs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update daily_induction_runs" ON public.daily_induction_runs;
CREATE POLICY "Users can update daily_induction_runs" ON public.daily_induction_runs
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Schedule results policies
DROP POLICY IF EXISTS "Users can view schedule_results" ON public.schedule_results;
CREATE POLICY "Users can view schedule_results" ON public.schedule_results
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can insert schedule_results" ON public.schedule_results;
CREATE POLICY "System can insert schedule_results" ON public.schedule_results
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update schedule_results" ON public.schedule_results;
CREATE POLICY "Users can update schedule_results" ON public.schedule_results
    FOR UPDATE USING (auth.uid() IS NOT NULL);





