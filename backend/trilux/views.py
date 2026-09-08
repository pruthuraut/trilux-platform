from django.shortcuts import render

# Create your views here.
def home(request):
    return render(request,'index.html',{'page':"Authentication"})

def SendMarketingEmail(request):
    pass