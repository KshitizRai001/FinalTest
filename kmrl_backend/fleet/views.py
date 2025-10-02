from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth.hashers import make_password
from django.utils import timezone
import pandas as pd
from .models import Train, CSVDataSource, CSVUpload, CSVDataRow, MLModel, MLTrainingSession
from .serializers import TrainSerializer
from .ml_models import create_model, get_available_models
from .authentication import CsrfExemptSessionAuthentication

class TrainViewSet(viewsets.ModelViewSet):
    queryset = Train.objects.all()
    serializer_class = TrainSerializer
    permission_classes = [IsAuthenticated]

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def staff_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(request, username=username, password=password)
    if user is not None and user.is_staff:
        login(request, user)
        return Response({
            'success': True,
            'message': 'Staff login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'is_staff': user.is_staff,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        }, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Invalid credentials or not a staff member'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([IsAuthenticated])
def staff_logout(request):
    logout(request)
    return Response({'success': True, 'message': 'Logged out successfully'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def staff_signup(request):
    username = request.data.get('username')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    email = request.data.get('email', '')
    
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if len(password) < 8:
        return Response({'error': 'Password must be at least 8 characters long'}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.create(
            username=username,
            password=make_password(password),
            first_name=first_name,
            last_name=last_name,
            email=email,
            is_staff=True  # All registered users are staff members
        )
        
        return Response({
            'success': True,
            'message': 'Staff account created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': 'Failed to create account'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_profile(request):
    user = request.user
    if user.is_staff:
        return Response({
            'id': user.id,
            'username': user.username,
            'is_staff': user.is_staff,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email
        }, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Not a staff member'}, status=status.HTTP_403_FORBIDDEN)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def ingest_csv_data(request):
    """Handle CSV data ingestion from frontend"""
    try:
        data = request.data
        source_name = data.get('source')
        filename = data.get('fileName')
        headers = data.get('headers', [])
        rows = data.get('rows', [])
        
        if not all([source_name, filename, headers, rows]):
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create data source
        data_source, created = CSVDataSource.objects.get_or_create(
            name=source_name,
            defaults={'description': f'Data source for {source_name}'}
        )
        
        # Create CSV upload record
        csv_upload = CSVUpload.objects.create(
            source=data_source,
            filename=filename,
            row_count=len(rows),
            headers=headers
        )
        
        # Store individual rows
        for idx, row_data in enumerate(rows):
            CSVDataRow.objects.create(
                upload=csv_upload,
                row_data=row_data,
                row_index=idx
            )
        
        return Response({
            'success': True,
            'message': f'Successfully ingested {len(rows)} rows from {filename}',
            'upload_id': csv_upload.id
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_csv_data(request):
    """Get stored CSV data for ML training"""
    try:
        source_name = request.GET.get('source')
        if source_name:
            data_source = CSVDataSource.objects.get(name=source_name)
            uploads = CSVUpload.objects.filter(source=data_source)
        else:
            uploads = CSVUpload.objects.all()
        
        result = []
        for upload in uploads:
            rows = list(upload.data_rows.values('row_data', 'row_index'))
            result.append({
                'upload_id': upload.id,
                'source': upload.source.name,
                'filename': upload.filename,
                'headers': upload.headers,
                'row_count': upload.row_count,
                'uploaded_at': upload.uploaded_at,
                'rows': rows
            })
        
        return Response(result, status=status.HTTP_200_OK)
        
    except CSVDataSource.DoesNotExist:
        return Response({'error': 'Data source not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def train_ml_model(request):
    """Train an ML model with stored CSV data"""
    try:
        data = request.data
        model_type = data.get('model_type')
        model_name = data.get('model_name', f'{model_type}_model')
        config = data.get('config', {})
        data_sources = data.get('data_sources', [])
        
        if not model_type:
            return Response({'error': 'model_type is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if model_type not in get_available_models():
            return Response({
                'error': f'Invalid model type. Available types: {get_available_models()}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create ML model record
        ml_model = MLModel.objects.create(
            name=model_name,
            model_type=model_type,
            configuration=config,
            description=f'ML model for {model_type}'
        )
        
        # Create training session
        training_session = MLTrainingSession.objects.create(
            model=ml_model,
            status='training'
        )
        
        # Add data sources to training session
        for source_name in data_sources:
            try:
                data_source = CSVDataSource.objects.get(name=source_name)
                training_session.data_sources.add(data_source)
            except CSVDataSource.DoesNotExist:
                continue
        
        # Prepare training data
        training_data = []
        for data_source in training_session.data_sources.all():
            uploads = CSVUpload.objects.filter(source=data_source)
            for upload in uploads:
                rows = upload.data_rows.all()
                for row in rows:
                    training_data.append(row.row_data)
        
        if not training_data:
            training_session.status = 'failed'
            training_session.save()
            return Response({'error': 'No training data found'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create and train the model
        model_instance = create_model(model_type, config)
        df = pd.DataFrame(training_data)
        
        # Train the model
        metrics = model_instance.train(df)
        
        # Update training session
        training_session.status = 'completed'
        training_session.metrics = metrics
        training_session.completed_at = timezone.now()
        training_session.save()
        
        # Mark model as active if training successful
        ml_model.is_active = True
        ml_model.save()
        
        return Response({
            'success': True,
            'message': 'Model trained successfully',
            'model_id': ml_model.id,
            'training_session_id': training_session.id,
            'metrics': metrics
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        # Update training session to failed if it exists
        if 'training_session' in locals():
            training_session.status = 'failed'
            training_session.save()
        
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def predict_with_model(request):
    """Make predictions using a trained ML model"""
    try:
        data = request.data
        model_id = data.get('model_id')
        input_data = data.get('input_data', [])
        
        if not model_id:
            return Response({'error': 'model_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the ML model
        ml_model = MLModel.objects.get(id=model_id)
        
        if not ml_model.is_active:
            return Response({'error': 'Model is not active'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create model instance
        model_instance = create_model(ml_model.model_type, ml_model.configuration)
        
        # For this demo, we'll simulate training by getting some data
        # In a real implementation, you'd load the trained model state
        training_data = []
        latest_session = ml_model.training_sessions.filter(status='completed').first()
        if latest_session:
            for data_source in latest_session.data_sources.all():
                uploads = CSVUpload.objects.filter(source=data_source)
                for upload in uploads:
                    rows = upload.data_rows.all()[:10]  # Just get some sample data
                    for row in rows:
                        training_data.append(row.row_data)
        
        if training_data:
            df_train = pd.DataFrame(training_data)
            model_instance.train(df_train)  # Quick training for demo
        
        # Make predictions
        df_input = pd.DataFrame(input_data)
        predictions = model_instance.predict(df_input)
        feature_importance = model_instance.get_feature_importance()
        
        return Response({
            'success': True,
            'predictions': predictions.tolist(),
            'feature_importance': feature_importance,
            'model_info': {
                'name': ml_model.name,
                'type': ml_model.model_type,
                'is_active': ml_model.is_active
            }
        }, status=status.HTTP_200_OK)
        
    except MLModel.DoesNotExist:
        return Response({'error': 'Model not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ml_models(request):
    """Get list of available ML models"""
    try:
        models = MLModel.objects.all()
        result = []
        
        for model in models:
            latest_session = model.training_sessions.filter(status='completed').first()
            result.append({
                'id': model.id,
                'name': model.name,
                'model_type': model.model_type,
                'is_active': model.is_active,
                'created_at': model.created_at,
                'latest_training': latest_session.metrics if latest_session else None
            })
        
        return Response({
            'models': result,
            'available_types': get_available_models()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)