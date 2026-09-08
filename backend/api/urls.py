from django.urls import path
from . import views
urlpatterns = [
    # path('', views.api),
    # SMTP Routes
    path('send-alert-email/',views.SendAlertEmailAPIView.as_view()),
    path('send-marketing-email/',views.SendMarketingEmailAPIView.as_view()),
    path('send-subscription-email/',views.SendSubscriptionEmailAPIView.as_view()),
    path('send-invoice-email/',views.SendInvoiceEmailAPIView.as_view()),
    path('send-waitlist-email/',views.SendWaitlistEmailAPIView.as_view()),
    path('join-waitlist/',views.JoinEarlyAccessAPIView.as_view()),
    path('contact-form/',views.ContactFormAPIView.as_view()),

    # Project Routes
    path('project/<int:id>/',views.ProjectAPIView.as_view()),
    path('project/',views.ProjectAPIView.as_view()),

    # Static Analysis Routes
    path('static-analysis/<uuid:scan_uuid>/',views.StaticAnalysisAPIView.as_view()),
    path('static-analysis/',views.StaticAnalysisAPIView.as_view()),

    # Dynamic Analysis Routes
    path('dynamic-analysis/<uuid:scan_uuid>/',views.DynamicAnalysisAPIView.as_view()),
    path('dynamic-analysis/',views.DynamicAnalysisAPIView.as_view()),

    # Mobile APP Analysis Routes
    path('mobile-app-analysis/<uuid:scan_uuid>/',views.MobileAppAnalysisAPIView.as_view()),
    path('mobile-app-analysis/',views.MobileAppAnalysisAPIView.as_view()),

    # Browser Extension Analysis Routes
    path('browser-extension-analysis/<uuid:scan_uuid>/',views.BrowserExtensionAnalysisAPIView.as_view()),
    path('browser-extension-analysis/',views.BrowserExtensionAnalysisAPIView.as_view()),

    # Software Composition Analysis (SCA) Routes
    path('sca-analysis/<uuid:scan_uuid>/',views.SCAAnalysisAPIView.as_view()),
    path('sca-analysis/',views.SCAAnalysisAPIView.as_view()),

    # SAST triage (persistent false-positive / accepted-risk / won't-fix)
    path('sast-triage/',views.SASTTriageAPIView.as_view()),

    # dynamic + static analysis
    path('analyses/', views.GroupedAnalysisView.as_view()),
    path('analyses/<int:id>/', views.GroupedAnalysisView.as_view()),

    # Vulnerability Analysis Routes
    path('vulnerability-analysis/<int:id>/',views.VulnerabilityAnalysisAPIView.as_view()),
    path('vulnerability-analysis/',views.VulnerabilityAnalysisAPIView.as_view()),

    # Report Routes
    path('report/',views.ReportAPIView.as_view()),
    path('report/<uuid:report_uuid>/',views.ReportAPIView.as_view()),

    # Security Policy Routes
    path('security-policy/<int:id>/',views.SecurityPolicyAPIView.as_view()),
    path('security-policy/',views.SecurityPolicyAPIView.as_view()),

    # Security Alert Routes
    path('security-alert/<int:id>/',views.SecurityAlertAPIView.as_view()),
    path('security-alert/',views.SecurityAlertAPIView.as_view()),

    # Support Ticket Routes
    path('support-ticket/<int:id>/',views.SupportTicketAPIView.as_view()),
    path('support-ticket/',views.SupportTicketAPIView.as_view()),

    # Support Chat Routes
    path('support-chat/<int:id>/',views.SupportChatAPIView.as_view()),
    path('support-chat/',views.SupportChatAPIView.as_view()),

    # Notification Routes
    path('notification/<int:id>/',views.NotificationAPIView.as_view()),
    path('notification/',views.NotificationAPIView.as_view()),

    # Dashboard Analytics Routes
    path('dashboard-analytics/<int:id>/',views.DashboardAnalyticsAPIView.as_view()),
    path('dashboard-analytics/',views.DashboardAnalyticsAPIView.as_view()),

    # Pricing Plan Routes
    path('pricing/<int:id>/',views.PricingPlanAPIView.as_view()),
    path('pricing/',views.PricingPlanAPIView.as_view()),

    # Subscription Routes
    path('subscription/<int:id>/',views.SubscriptionAPIView.as_view()),
    path('subscription/',views.SubscriptionAPIView.as_view()),

    # Payment Routes
    path('payment/<int:id>/',views.PaymentAPIView.as_view()),
    path('payment/',views.PaymentAPIView.as_view()),

    # path('invoice/<int:id>/',views.InvoiceAPIView.as_view()),
    # path('invoice/',views.InvoiceAPIView.as_view()),

    path('testing/<int:id>/',views.TestingAPIView.as_view()),
    path('testing/',views.TestingAPIView.as_view())
]
