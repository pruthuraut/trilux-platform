from django.urls import path
from . import views
urlpatterns = [
    path('', views.blog),
    path('blog/', views.BlogAPIView.as_view()),
    path('blog-comment/', views.BlogCommentAPIView.as_view()),
]
