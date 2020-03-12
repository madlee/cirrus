from django.urls import path

from . import views

urlpatterns = [
    path('header.json', views.header, name='header'),
    path('data.json', views.data, name='data'),
    path('chart.json', views.chart, name='chart'),

    path('set_format.act', views.set_format, name='set_format')
]
