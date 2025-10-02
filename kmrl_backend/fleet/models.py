from django.db import models
import json

class Train(models.Model):
    train_id = models.CharField(max_length=10, unique=True)
    fc_rs = models.BooleanField(default=False)
    fc_sig = models.BooleanField(default=False)
    fc_tel = models.BooleanField(default=False)
    open_jobs = models.IntegerField(default=0)
    branding_shortfall = models.IntegerField(default=0)
    mileage_km = models.IntegerField(default=0)
    cleaning_due = models.BooleanField(default=False)
    stabling_penalty = models.IntegerField(default=0)

    def __str__(self):
        return self.train_id

class CSVDataSource(models.Model):
    """Model to store information about CSV data sources"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class CSVUpload(models.Model):
    """Model to store CSV upload metadata"""
    source = models.ForeignKey(CSVDataSource, on_delete=models.CASCADE)
    filename = models.CharField(max_length=255)
    row_count = models.IntegerField()
    headers = models.JSONField()  # Store column headers as JSON array
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.source.name} - {self.filename}"

class CSVDataRow(models.Model):
    """Model to store individual CSV data rows"""
    upload = models.ForeignKey(CSVUpload, on_delete=models.CASCADE, related_name='data_rows')
    row_data = models.JSONField()  # Store row data as JSON object
    row_index = models.IntegerField()  # Original row index in CSV
    
    class Meta:
        ordering = ['row_index']
    
    def __str__(self):
        return f"{self.upload.filename} - Row {self.row_index}"

class MLModel(models.Model):
    """Model to store ML model metadata and configurations"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    model_type = models.CharField(max_length=50)  # e.g., 'classification', 'regression'
    configuration = models.JSONField(default=dict)  # Store model hyperparameters
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.model_type})"

class MLTrainingSession(models.Model):
    """Model to track ML model training sessions"""
    model = models.ForeignKey(MLModel, on_delete=models.CASCADE, related_name='training_sessions')
    data_sources = models.ManyToManyField(CSVDataSource)  # Which data sources were used
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('training', 'Training'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ])
    metrics = models.JSONField(default=dict)  # Store training metrics
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.model.name} - {self.started_at.strftime('%Y-%m-%d %H:%M')}"