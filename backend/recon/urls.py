from django.urls import path
from recon import views

urlpatterns = [
    # Full 12-step domain pipeline
    path('scan/', views.StartScanAPIView.as_view()),
    path('scan/<uuid:run_uuid>/', views.ScanDetailAPIView.as_view()),
    path('scan/<uuid:run_uuid>/findings/', views.ScanFindingsAPIView.as_view()),

    # On-demand modules
    path('module/', views.RunModuleAPIView.as_view()),

    # Authenticated API security scan (OWASP API Top 10) — accepts a dropped
    # Postman collection / OpenAPI spec, or a JSON body with target + auth.
    path('api-scan/', views.ApiScanAPIView.as_view()),

    # Tooling + AI
    path('tools/', views.ToolsStatusAPIView.as_view()),
    path('ai/', views.AiAnalysisAPIView.as_view()),
    path('brain/<uuid:run_uuid>/', views.BrainAPIView.as_view()),
]
