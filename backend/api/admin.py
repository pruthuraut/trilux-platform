from django.contrib import admin

# Register your models here.
from .models import *

# admin.site.register(User)
# admin.site.register(Organization)
# admin.site.register(UserProfile)
# admin.site.register(Verification)
# admin.site.register(ResetPassword)
admin.site.register(Subscription)
admin.site.register(PricingPlan)
admin.site.register(Notification)
admin.site.register(SupportChat)
admin.site.register(SupportTicket)
admin.site.register(SecurityAlert)
admin.site.register(SecurityPolicy)
admin.site.register(Report)
admin.site.register(VulnerabilityAnalysis)
admin.site.register(DynamicAnalysis)
admin.site.register(StaticAnalysis)
admin.site.register(SCAAnalysis)
admin.site.register(SASTTriage)
admin.site.register(Project)
admin.site.register(DashboardAnalytics)
admin.site.register(EarlyAccessUser)
admin.site.register(ContactForm)
# admin.site.register(WaitlistEmail)
# admin.site.register(InvoiceEmail)
# admin.site.register(SubscriptionEmail)
# admin.site.register(MarketingEmail)
# admin.site.register(AlertEmail)

