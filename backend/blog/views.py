from django.shortcuts import render
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.views import APIView

from blog.models import Blog
from blog.serializers import BlogSerializer

class BlogAPIView(APIView):
    permission_classes=[IsAuthenticated]
    authentication_classes=[TokenAuthentication]
    def get(self,request):
        try:
            blog_obj=Blog.objects.all()
            serializer=BlogSerializer(blog_obj,many=True)
            return Response(serializer.data,status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message':str(e)},status=status.HTTP_400_BAD_REQUEST)

    def post(self,request):
        try:
            serializer=BlogSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data,status=status.HTTP_201_CREATED)
            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message':str(e)},status=status.HTTP_400_BAD_REQUEST)

    def put(self,request):
        try:
            blog_obj=Blog.objects.get(id=request.data['id'])
            serializer=BlogSerializer(blog_obj,data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data,status=status.HTTP_200_OK)
        except Exception as e:
            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

    def delete(self,request):
        try:
            blog_obj=Blog.objects.get(id=request.data['id'])
            blog_obj.delete()
            return Response({'message':'Blog deleted successfully'},status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message':str(e)},status=status.HTTP_400_BAD_REQUEST)
        
class BlogCommentAPIView(APIView):
    permission_classes=[IsAuthenticated]
    authentication_classes=[TokenAuthentication]
    def get(self,request):
        try:
            blog_obj=Blog.objects.get(id=request.data['id'])
            serializer=BlogSerializer(blog_obj,many=True)
            return Response(serializer.data,status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message':str(e)},status=status.HTTP_400_BAD_REQUEST)

    def post(self,request):
        try:
            blog_obj=Blog.objects.get(id=request.data['id'])
            blog_obj.comments.add(request.data['comment'])
            return Response({'message':'Comment added successfully'},status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message':str(e)},status=status.HTTP_400_BAD_REQUEST)

    def put(self,request):
        try:
            blog_obj=Blog.objects.get(id=request.data['id'])
            blog_obj.comments.remove(request.data['comment'])
            return Response({'message':'Comment removed successfully'},status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message':str(e)},status=status.HTTP_400_BAD_REQUEST)

    def delete(self,request):
        try:
            blog_obj=Blog.objects.get(id=request.data['id'])
            blog_obj.comments.clear()
            return Response({'message':'All comments removed successfully'},status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message':str(e)},status=status.HTTP_400_BAD_REQUEST)

# Create your views here.
def blog(request):
    return render(request,'index.html',{'page':"Blog"})
