"""
Pluggable ML Model System for R.O.P.S.
Allows easy integration of different ML models for train optimization.
"""

import numpy as np
import pandas as pd
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
import json
from datetime import datetime

class BaseMLModel(ABC):
    """
    Abstract base class for all ML models in the system.
    Provides a standard interface for model training and prediction.
    """
    
    def __init__(self, name: str, model_type: str, config: Dict[str, Any] = None):
        self.name = name
        self.model_type = model_type
        self.config = config or {}
        self.is_trained = False
        self.model = None
        self.training_metrics = {}
    
    @abstractmethod
    def train(self, data: pd.DataFrame, target_column: str = None) -> Dict[str, float]:
        """
        Train the model on the provided data.
        
        Args:
            data: Training data as pandas DataFrame
            target_column: Name of the target column (for supervised learning)
        
        Returns:
            Dictionary of training metrics
        """
        pass
    
    @abstractmethod
    def predict(self, data: pd.DataFrame) -> np.ndarray:
        """
        Make predictions using the trained model.
        
        Args:
            data: Input data for prediction
        
        Returns:
            Prediction results as numpy array
        """
        pass
    
    @abstractmethod
    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance scores from the trained model.
        
        Returns:
            Dictionary mapping feature names to importance scores
        """
        pass
    
    def preprocess_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess data before training or prediction.
        Override this method for custom preprocessing.
        
        Args:
            data: Raw data
        
        Returns:
            Preprocessed data
        """
        return data
    
    def save_model_state(self) -> Dict[str, Any]:
        """
        Save the current model state for persistence.
        
        Returns:
            Dictionary containing model state
        """
        return {
            'name': self.name,
            'model_type': self.model_type,
            'config': self.config,
            'is_trained': self.is_trained,
            'training_metrics': self.training_metrics
        }

class TrainOptimizationModel(BaseMLModel):
    """
    ML Model for train optimization using random forest or similar algorithms.
    Predicts optimal train selection based on multiple criteria.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        default_config = {
            'algorithm': 'random_forest',
            'n_estimators': 100,
            'max_depth': 10,
            'random_state': 42,
            'features': [
                'fc_rs', 'fc_sig', 'fc_tel', 'open_jobs', 
                'branding_shortfall', 'mileage_km', 'cleaning_due', 'stabling_penalty'
            ]
        }
        if config:
            default_config.update(config)
        
        super().__init__('TrainOptimization', 'classification', default_config)
    
    def train(self, data: pd.DataFrame, target_column: str = 'suitability_score') -> Dict[str, float]:
        """
        Train the model to predict train suitability scores.
        """
        try:
            # For now, implement a simple scoring algorithm
            # In a real implementation, you'd use sklearn or similar
            processed_data = self.preprocess_data(data)
            
            # Calculate a simple composite score based on the criteria
            scores = []
            for _, row in processed_data.iterrows():
                score = self._calculate_composite_score(row)
                scores.append(score)
            
            # Store the training data for future predictions
            self.training_data = processed_data
            self.is_trained = True
            
            # Calculate some basic metrics
            self.training_metrics = {
                'data_points': len(data),
                'mean_score': np.mean(scores),
                'std_score': np.std(scores),
                'training_completed': datetime.now().isoformat()
            }
            
            return self.training_metrics
            
        except Exception as e:
            raise Exception(f"Training failed: {str(e)}")
    
    def predict(self, data: pd.DataFrame) -> np.ndarray:
        """
        Predict suitability scores for given train data.
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        processed_data = self.preprocess_data(data)
        scores = []
        
        for _, row in processed_data.iterrows():
            score = self._calculate_composite_score(row)
            scores.append(score)
        
        return np.array(scores)
    
    def get_feature_importance(self) -> Dict[str, float]:
        """
        Return feature importance based on the configured weights.
        """
        # This is a simplified version - in real ML models, 
        # this would come from the trained model
        importance = {
            'fc_rs': 0.25,
            'fc_sig': 0.25, 
            'fc_tel': 0.20,
            'open_jobs': 0.15,
            'mileage_km': 0.10,
            'stabling_penalty': 0.05
        }
        return importance
    
    def _calculate_composite_score(self, row: pd.Series) -> float:
        """
        Calculate a composite suitability score for a train.
        """
        # Fitness Certificate score (0-1)
        fc_score = (
            int(row.get('fc_rs', False)) +
            int(row.get('fc_sig', False)) +
            int(row.get('fc_tel', False))
        ) / 3.0
        
        # Job penalty (0-1, where fewer open jobs = higher score)
        job_penalty = max(0, 1 - (row.get('open_jobs', 0) * 0.2))
        
        # Mileage score (simplified)
        target_mileage = 950
        mileage_dev = abs(row.get('mileage_km', target_mileage) - target_mileage)
        mileage_score = max(0, 1 - (mileage_dev / 250))
        
        # Stabling penalty (0-1)
        stabling_score = max(0, 1 - (row.get('stabling_penalty', 0) / 100))
        
        # Cleaning penalty
        cleaning_score = 0.65 if row.get('cleaning_due', False) else 1.0
        
        # Weighted composite score
        weights = self.config.get('weights', {
            'fc': 0.4, 'jobs': 0.2, 'mileage': 0.2, 'stabling': 0.1, 'cleaning': 0.1
        })
        
        composite = (
            fc_score * weights['fc'] +
            job_penalty * weights['jobs'] +
            mileage_score * weights['mileage'] +
            stabling_score * weights['stabling'] +
            cleaning_score * weights['cleaning']
        )
        
        return min(100, max(0, composite * 100))  # Scale to 0-100

class PredictiveMaintenanceModel(BaseMLModel):
    """
    ML Model for predicting maintenance requirements.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        default_config = {
            'prediction_horizon': 30,  # days
            'maintenance_threshold': 0.7
        }
        if config:
            default_config.update(config)
        
        super().__init__('PredictiveMaintenance', 'regression', default_config)
    
    def train(self, data: pd.DataFrame, target_column: str = 'maintenance_needed') -> Dict[str, float]:
        # Simplified implementation
        self.is_trained = True
        self.training_metrics = {
            'data_points': len(data),
            'training_completed': datetime.now().isoformat()
        }
        return self.training_metrics
    
    def predict(self, data: pd.DataFrame) -> np.ndarray:
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        # Simplified prediction based on open jobs and mileage
        predictions = []
        for _, row in data.iterrows():
            risk_score = (
                row.get('open_jobs', 0) * 0.3 +
                (row.get('mileage_km', 0) / 1000) * 0.4 +
                row.get('stabling_penalty', 0) / 100 * 0.3
            )
            predictions.append(min(1.0, risk_score))
        
        return np.array(predictions)
    
    def get_feature_importance(self) -> Dict[str, float]:
        return {
            'open_jobs': 0.4,
            'mileage_km': 0.35,
            'stabling_penalty': 0.25
        }

# Model Registry
MODEL_REGISTRY = {
    'train_optimization': TrainOptimizationModel,
    'predictive_maintenance': PredictiveMaintenanceModel
}

def get_available_models() -> List[str]:
    """Get list of available model types."""
    return list(MODEL_REGISTRY.keys())

def create_model(model_type: str, config: Dict[str, Any] = None) -> BaseMLModel:
    """
    Factory function to create ML models.
    
    Args:
        model_type: Type of model to create
        config: Configuration parameters for the model
    
    Returns:
        Instantiated ML model
    """
    if model_type not in MODEL_REGISTRY:
        raise ValueError(f"Unknown model type: {model_type}. Available types: {list(MODEL_REGISTRY.keys())}")
    
    model_class = MODEL_REGISTRY[model_type]
    return model_class(config)