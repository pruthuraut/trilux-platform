from django.urls import path
from authenticate import views
from django.conf import settings
from django.conf.urls.static import static
urlpatterns = [
    # path('', views.authenticate),
    path('signin/', views.sign_in),
    path('signup/', views.sign_up.as_view()),
    path('signout/', views.LogoutView.as_view()),
    path('forgotPassword/', views.forgot_password.as_view()),
    path('resetPassword/', views.reset_password.as_view()),
    path('verifyOTP/', views.verify_OTP.as_view()),
    path('uuid-login/', views.UUIDLoginView.as_view()),
    path('create-demo-user/', views.CreateDemoUserView.as_view()),
    path('demo-access-accounts/', views.DemoAccessAccountListView.as_view()),
    path('profile/', views.UserProfileAPIView.as_view()),
    path('organization/<int:id>/',views.OrganizationAPIView.as_view()),
    path('organization/',views.OrganizationAPIView.as_view()),
    path('validate-token/', views.ValidateTokenAPIView.as_view()),
]
if settings.DEBUG:
    urlpatterns+=static(settings.MEDIA_URL,document_root=settings.MEDIA_ROOT)