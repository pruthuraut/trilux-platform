from django.contrib import admin
from django.urls import path, include

from django.conf import settings
from django.conf.urls.static import static

from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/',include('authenticate.urls')),
    path('api/',include('api.urls')),
    path('blog/',include('blog.urls')),
    path('dashboard/',include('dashboard.urls')),
    path('portal/',include('portal.urls')),
    path('recon/',include('recon.urls')),
    path('',views.home)
]
if settings.DEBUG:
    urlpatterns+=static(settings.MEDIA_URL,document_root=settings.MEDIA_ROOT)