-- Supabase Migration Script
-- Run these commands in your Supabase SQL Editor

-- Note: Supabase handles JWT secrets automatically, no manual configuration needed

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

-- Enable Row Level Security
ALTER TABLE public.trains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_data_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_training_data_sources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
-- Trains table - accessible to all authenticated users
CREATE POLICY "Allow authenticated users to view trains" ON public.trains
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert trains" ON public.trains
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update trains" ON public.trains
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete trains" ON public.trains
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- CSV data sources - accessible to all authenticated users
CREATE POLICY "Allow authenticated users to view csv_data_sources" ON public.csv_data_sources
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert csv_data_sources" ON public.csv_data_sources
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update csv_data_sources" ON public.csv_data_sources
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- CSV uploads - users can only access their own uploads
CREATE POLICY "Users can view their own csv_uploads" ON public.csv_uploads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own csv_uploads" ON public.csv_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own csv_uploads" ON public.csv_uploads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own csv_uploads" ON public.csv_uploads
    FOR DELETE USING (auth.uid() = user_id);

-- CSV data rows - users can only access rows from their uploads
CREATE POLICY "Users can view csv_data_rows from their uploads" ON public.csv_data_rows
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.csv_uploads 
            WHERE csv_uploads.id = csv_data_rows.upload_id 
            AND csv_uploads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert csv_data_rows for their uploads" ON public.csv_data_rows
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.csv_uploads 
            WHERE csv_uploads.id = csv_data_rows.upload_id 
            AND csv_uploads.user_id = auth.uid()
        )
    );

-- ML models - users can only access their own models
CREATE POLICY "Users can view their own ml_models" ON public.ml_models
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ml_models" ON public.ml_models
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ml_models" ON public.ml_models
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ml_models" ON public.ml_models
    FOR DELETE USING (auth.uid() = user_id);

-- ML training sessions - users can only access their own sessions
CREATE POLICY "Users can view their own ml_training_sessions" ON public.ml_training_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ml_training_sessions" ON public.ml_training_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ml_training_sessions" ON public.ml_training_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- ML training data sources junction table
CREATE POLICY "Users can view ml_training_data_sources for their sessions" ON public.ml_training_data_sources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ml_training_sessions 
            WHERE ml_training_sessions.id = ml_training_data_sources.training_session_id 
            AND ml_training_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert ml_training_data_sources for their sessions" ON public.ml_training_data_sources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ml_training_sessions 
            WHERE ml_training_sessions.id = ml_training_data_sources.training_session_id 
            AND ml_training_sessions.user_id = auth.uid()
        )
    );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER handle_trains_updated_at
    BEFORE UPDATE ON public.trains
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_csv_data_sources_updated_at
    BEFORE UPDATE ON public.csv_data_sources
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_ml_models_updated_at
    BEFORE UPDATE ON public.ml_models
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
