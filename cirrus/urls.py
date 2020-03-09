from django.urls import path

from . import views

urlpatterns = [
    path('header/', views.header, name='header'),
    path('data/', views.data, name='data'),
    path('chart/', views.chart, name='chart'),
]
