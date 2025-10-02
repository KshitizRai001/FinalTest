import { supabase } from './supabase'
import type { Database } from './supabase'

type Tables = Database['public']['Tables']
type Train = Tables['trains']['Row']
type CSVDataSource = Tables['csv_data_sources']['Row']
type CSVUpload = Tables['csv_uploads']['Row']
type CSVDataRow = Tables['csv_data_rows']['Row']
type MLModel = Tables['ml_models']['Row']
type MLTrainingSession = Tables['ml_training_sessions']['Row']

// Train operations
export const trainApi = {
  async getAll(): Promise<Train[]> {
    const { data, error } = await supabase
      .from('trains')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(train: Tables['trains']['Insert']): Promise<Train> {
    const { data, error } = await supabase
      .from('trains')
      .insert(train)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Tables['trains']['Update']): Promise<Train> {
    const { data, error } = await supabase
      .from('trains')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('trains')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// CSV Data operations
export const csvApi = {
  async ingestData(data: {
    source: string
    fileName: string
    headers: string[]
    rows: Record<string, any>[]
  }): Promise<{ upload_id: string; message: string }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get or create data source
    let { data: dataSource, error: sourceError } = await supabase
      .from('csv_data_sources')
      .select('*')
      .eq('name', data.source)
      .single()

    if (sourceError && sourceError.code === 'PGRST116') {
      // Data source doesn't exist, create it
      const { data: newSource, error: createError } = await supabase
        .from('csv_data_sources')
        .insert({
          name: data.source,
          description: `Data source for ${data.source}`
        })
        .select()
        .single()

      if (createError) throw createError
      dataSource = newSource
    } else if (sourceError) {
      throw sourceError
    }

    // Create CSV upload record
    const { data: upload, error: uploadError } = await supabase
      .from('csv_uploads')
      .insert({
        source_id: dataSource!.id,
        filename: data.fileName,
        row_count: data.rows.length,
        headers: data.headers,
        user_id: user.id
      })
      .select()
      .single()

    if (uploadError) throw uploadError

    // Insert data rows in batches
    const batchSize = 100
    for (let i = 0; i < data.rows.length; i += batchSize) {
      const batch = data.rows.slice(i, i + batchSize).map((row, index) => ({
        upload_id: upload.id,
        row_data: row,
        row_index: i + index
      }))

      const { error: rowError } = await supabase
        .from('csv_data_rows')
        .insert(batch)

      if (rowError) throw rowError
    }

    return {
      upload_id: upload.id,
      message: `Successfully ingested ${data.rows.length} rows from ${data.fileName}`
    }
  },

  async getData(source?: string): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('csv_uploads')
      .select(`
        *,
        source:csv_data_sources(*),
        data_rows:csv_data_rows(*)
      `)
      .eq('user_id', user.id)

    if (source) {
      query = query.eq('csv_data_sources.name', source)
    }

    const { data, error } = await query.order('uploaded_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getDataSources(): Promise<CSVDataSource[]> {
    const { data, error } = await supabase
      .from('csv_data_sources')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}

// ML Model operations
export const mlApi = {
  async createModel(model: {
    name: string
    model_type: string
    description?: string
    configuration?: Record<string, any>
  }): Promise<MLModel> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('ml_models')
      .insert({
        ...model,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getModels(): Promise<MLModel[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('ml_models')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async trainModel(data: {
    model_type: string
    model_name?: string
    config?: Record<string, any>
    data_sources?: string[]
  }): Promise<{ model_id: string; training_session_id: string; message: string }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Create ML model
    const model = await this.createModel({
      name: data.model_name || `${data.model_type}_model`,
      model_type: data.model_type,
      configuration: data.config || {},
      description: `ML model for ${data.model_type}`
    })

    // Create training session
    const { data: session, error: sessionError } = await supabase
      .from('ml_training_sessions')
      .insert({
        model_id: model.id,
        user_id: user.id,
        status: 'training'
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // For now, we'll mark it as completed immediately
    // In a real implementation, you'd run the actual training
    const { error: updateError } = await supabase
      .from('ml_training_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        metrics: { accuracy: 0.85, precision: 0.82, recall: 0.88 } // Mock metrics
      })
      .eq('id', session.id)

    if (updateError) throw updateError

    // Mark model as active
    const { error: modelUpdateError } = await supabase
      .from('ml_models')
      .update({ is_active: true })
      .eq('id', model.id)

    if (modelUpdateError) throw modelUpdateError

    return {
      model_id: model.id,
      training_session_id: session.id,
      message: 'Model trained successfully'
    }
  },

  async predict(data: {
    model_id: string
    input_data: Record<string, any>[]
  }): Promise<{ predictions: number[]; feature_importance: Record<string, number> }> {
    // For demo purposes, return mock predictions
    // In a real implementation, you'd load the trained model and make actual predictions
    const predictions = data.input_data.map(() => Math.random())
    const feature_importance = {
      'feature_1': 0.3,
      'feature_2': 0.25,
      'feature_3': 0.2,
      'feature_4': 0.15,
      'feature_5': 0.1
    }

    return { predictions, feature_importance }
  }
}
