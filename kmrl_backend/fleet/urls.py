from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'trains', views.TrainViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', views.staff_login, name='staff_login'),
    path('auth/signup/', views.staff_signup, name='staff_signup'),
    path('auth/logout/', views.staff_logout, name='staff_logout'),
    path('auth/profile/', views.staff_profile, name='staff_profile'),
    path('csv/ingest/', views.ingest_csv_data, name='ingest_csv_data'),
    path('csv/data/', views.get_csv_data, name='get_csv_data'),
    path('ml/train/', views.train_ml_model, name='train_ml_model'),
    path('ml/predict/', views.predict_with_model, name='predict_with_model'),
    path('ml/models/', views.get_ml_models, name='get_ml_models'),
]