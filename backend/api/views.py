from datetime import datetime
import json
import os
import requests
from api.permissions import IsSuperuser
from api.tasks import CloneRepoTask, LLMtestingTask, NucleiTestingTask, MobileAppAnalysisTask, BrowserExtensionAnalysisTask, SCAScanTask, TaintAnalysisTask
from authenticate.models import Organization
from trilux.config import Config as AppConfig
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Prefetch
from authenticate.tasks import sendContactFormTask, sendVulnerabilityEmailTask, sendMarketingEmailTask, sendSubscriptionEmailTask, sendInvoiceEmailTask, sendWaitlistEmailTask
from .models import *
from .serializers import *
from decouple import config
from helpers.s3_helper import S3Helper
import logging

logger = logging.getLogger(__name__)


# SMTP API Views
class SendAlertEmailAPIView(APIView):
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsSuperuser]
    def post(self, request):
        try:
            email= request.data.get('email')
            sendVulnerabilityEmailTask.delay(email)
            return Response({'message':'Email sent successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class SendMarketingEmailAPIView(APIView):
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsSuperuser]
    def post(self, request):
        try:
            email= request.data.get('email')
            sendMarketingEmailTask.delay(email)
            return Response({'message':'Email sent successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class SendSubscriptionEmailAPIView(APIView):
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsSuperuser]
    def post(self, request):
        try:
            email= request.data.get('email')
            sendSubscriptionEmailTask.delay(email)
            return Response({'message':'Email sent successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class SendInvoiceEmailAPIView(APIView):
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsSuperuser]
    def post(self, request):
        try:
            email= request.data.get('email')
            sendInvoiceEmailTask.delay(email)
            return Response({'message':'Email sent successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class SendWaitlistEmailAPIView(APIView):
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsSuperuser]
    def post(self, request):
        try:
            email= request.data.get('email')
            sendWaitlistEmailTask.delay(email)
            return Response({'message':'Email sent successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Dashboard API Views
class ProjectAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, id=None):
        try:
            user = request.user  # Get the currently authenticated user
            
            if id:
                # If an id is provided, return a specific project for the logged-in user
                data = Project.objects.filter(user_id=user.id, pk=id)
            else:
                # If no id is provided, return all projects for the logged-in user
                data = Project.objects.filter(user_id=user.id)
            
            serializer = ProjectSerializer(data, many=True)
            if serializer.data:
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response({'message': 'Project not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            # Assign the current user to the project data
            data = request.data.copy()
            data['user_id'] = request.user.id  # Set the logged-in user's id
            
            serializer = ProjectSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, id):
        try:
            user = request.user
            # Ensure that the logged-in user can only update their own projects
            data = Project.objects.get(pk=id, user_id=user.id)  # Ensure the user is the owner of the project

            serializer = ProjectSerializer(data, data=request.data, partial=True)  # Use partial=True for patch
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Project.DoesNotExist:
            return Response({'message': 'Not found or not authorized to update this project.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id):
        try:
            user = request.user
            # Ensure that the logged-in user can only delete their own projects
            data = Project.objects.get(pk=id, user_id=user.id)  # Ensure the user is the owner of the project
            data.delete()
            return Response({'message': 'Project deleted successfully'}, status=status.HTTP_200_OK)
        
        except Project.DoesNotExist:
            return Response({'message': 'Not found or not authorized to delete this project.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StaticAnalysisAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, scan_uuid=None):
        try:
            user = request.user  # Get the currently authenticated user
            
            if scan_uuid:
                # If a scan_uuid is provided, return a specific StaticAnalysis instance
                data = StaticAnalysis.objects.filter(user_id=user.id, scan_uuid=scan_uuid)
                serializer = StaticAnalysisSerializer(data, many=True)
                
                # Process each item to fetch S3 content ONLY for specific ID requests
                if serializer.data:
                    result_data = []
                    
                    for item in serializer.data:
                        item_copy = item.copy()
                        
                        # If the item has LLM_analysis_result with an S3 path
                        if item.get('LLM_analysis_result') and 's3://' in item.get('LLM_analysis_result'):
                            try:
                                # Parse the S3 path
                                s3_path = item['LLM_analysis_result']
                                bucket_name = s3_path.split('://')[1].split('/')[0]
                                object_key = '/'.join(s3_path.split('://')[1].split('/')[1:])
                                
                                # Initialize S3Helper with the correct bucket
                                s3_helper = S3Helper(bucket_name=bucket_name)
                                
                                # Get the object from S3 using S3Helper
                                download_result = s3_helper.download_file_obj(object_key)
                                if download_result['success']:
                                    content = download_result['file_obj'].read().decode('utf-8')
                                    
                                    # Parse the JSON content
                                    content_data = json.loads(content)
                                
                                # Transform the data to the expected format
                                transformed_data = []
                                
                                for entry in content_data:
                                    try:
                                        vulnerabilities = entry.get('vulnerabilities', [])
                                        entry_message = entry.get('message', '')
                                        entry_timestamp = entry.get('timestamp', '')
                                        entry_location = entry.get('location', {})

                                        for vuln in vulnerabilities:
                                            location = vuln.get('location', {})
                                            # Support both camelCase (filePath/lineNumber) and snake_case (file_path/line_number)
                                            file_path = location.get('filePath', '') or location.get('file_path', '')
                                            line_number = location.get('lineNumber', None) or location.get('line_number', None)

                                            # Get tips - support both 'tips' (array) and 'tip' (string) keys
                                            tips = vuln.get("tips", vuln.get("tip", []))
                                            if isinstance(tips, str):
                                                tips = [tips] if tips else []

                                            transformed_vuln = {
                                                "id": vuln.get("id", ""),
                                                "vulnerability_type": vuln.get("vulnerability_type", []),
                                                "title": vuln.get("title", ""),
                                                "severity": vuln.get("severity", "").lower(),
                                                "description": vuln.get("description", ""),
                                                "location": {
                                                    "filePath": file_path.replace('\\_', '_'),
                                                    "lineNumber": line_number
                                                },
                                                "fix": vuln.get("fix", ""),
                                                "tips": tips,
                                                "message": entry_message,
                                                "timestamp": entry_timestamp,
                                            }
                                            transformed_data.append(transformed_vuln)

                                    except Exception as e:
                                        logger.error(f"Error parsing vulnerability: {str(e)}")
                                        logger.error(f"Entry content: {entry}")

                                # Replace the S3 path with the actual transformed content
                                item_copy['LLM_analysis_result'] = transformed_data
                            
                            except Exception as e:
                                logger.error(f"Error fetching LLM analysis results: {str(e)}")
                                # Keep the original S3 path in case of error
                        
                        result_data.append(item_copy)
                    
                    return Response(result_data, status=status.HTTP_200_OK)
                
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                # If no id is provided, return all StaticAnalysis records without processing S3 content
                data = StaticAnalysis.objects.filter(user_id=user.id)
                serializer = StaticAnalysisSerializer(data, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            user = request.user  # Get the currently authenticated user
            
            # Ensure the required fields are provided in the request body
            data = request.data
            project_id = data.get('project')
            static_analysis_type = data.get('static_analysis_type')
            source_url = data.get('source_url')
            repo_token = data.get('repo_token')
            repo_type = data.get('repo_type')
            source_file = request.FILES.get('source_file')

            # An uploaded .zip of dropped source runs through the cross-file taint
            # SAST engine (no clone / URL / token needed) — force type=Taint.
            if source_file:
                if not source_file.name.lower().endswith('.zip'):
                    return Response({'message': 'Uploaded source must be a .zip archive'},
                                    status=status.HTTP_400_BAD_REQUEST)
                static_analysis_type = StaticAnalysis.StaticAnalysisType.Taint

            is_taint = static_analysis_type == StaticAnalysis.StaticAnalysisType.Taint

            if not project_id or not static_analysis_type:
                return Response({'message': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)
            # Non-upload scans need a source_url; uploads provide the file instead.
            if not source_file and not source_url:
                return Response({'message': 'Provide either source_url or a source_file (.zip of your code)'},
                                status=status.HTTP_400_BAD_REQUEST)
            # Taint runs a public shallow clone / upload — no repo token/type needed.
            if not is_taint and not repo_token:
                return Response({'message': 'Missing Repository token'}, status=status.HTTP_400_BAD_REQUEST)
            if not is_taint and not repo_type:
                return Response({'message': 'Missing Repository type'}, status=status.HTTP_400_BAD_REQUEST)


            # Check if the project exists and belongs to the authenticated user
            try:
                project = Project.objects.get(id=project_id, user_id=user.id)
            except Project.DoesNotExist:
                return Response({'message': 'Project not found or does not belong to the user'}, status=status.HTTP_400_BAD_REQUEST)

            # Create a new StaticAnalysis instance
            static_analysis = StaticAnalysis.objects.create(
                user_id=user,
                project=project,
                static_analysis_type=static_analysis_type,
                source_type=(StaticAnalysis.SourceType.Upload if source_file
                             else StaticAnalysis.SourceType.GitHub),
                source_url=(source_url or None),
                source_file=(source_file if source_file else None),
            )

            # Optionally, you could initialize other fields (such as LLM_analysis_result) here
            serializer = StaticAnalysisSerializer(static_analysis)
            print(serializer.data['id'])  # Use dictionary access instead of dot notation
            data['staticAnalysis_id'] = serializer.data['id']

            # Cross-file taint SAST. It runs as its own scan type ('Taint') — including
            # every uploaded .zip — and is ALSO auto-triggered for the URL-based
            # LLM/GitLeaks/CVE pipelines so taint findings are always produced.
            if is_taint:
                # Standalone taint run (URL clone or uploaded zip) — owns the status.
                TaintAnalysisTask.delay(static_analysis.id, is_primary=True)
            else:
                str_data = str(data)
                print('str_data', str_data)
                CloneRepoTask.delay(str_data)  # LLM/GitLeaks/CVE pipeline (owns status)
                # Auto-run taint alongside; is_primary=False so it won't race the
                # primary pipeline's status and only writes Taint_analysis_result.
                TaintAnalysisTask.delay(static_analysis.id, is_primary=False)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def patch(self, request, scan_uuid):
        try:
            user = request.user
            # Ensure that the logged-in user can only update their own StaticAnalysis record
            data = StaticAnalysis.objects.get(scan_uuid=scan_uuid, user_id=user.id)  # Ensure the user is the owner of the record

            serializer = StaticAnalysisSerializer(data, data=request.data, partial=True)  # Use partial=True for patch
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except StaticAnalysis.DoesNotExist:
            return Response({'message': 'Not found or not authorized to update this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, scan_uuid):
        try:
            user = request.user
            # Ensure that the logged-in user can only delete their own StaticAnalysis record
            data = StaticAnalysis.objects.get(scan_uuid=scan_uuid, user_id=user.id)  # Ensure the user is the owner of the record
            data.delete()
            return Response({'message': 'StaticAnalysis record deleted successfully'}, status=status.HTTP_200_OK)
        
        except StaticAnalysis.DoesNotExist:
            return Response({'message': 'Not found or not authorized to delete this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class DynamicAnalysisAPIView(APIView):
    authentication_classes = [JWTAuthentication]  # Assuming you're using JWT authentication
    permission_classes = [IsAuthenticated]

    def get(self, request, scan_uuid=None):
        try:
            # Ensure that the logged-in user can only access their own data
            user = request.user  # Get the currently authenticated user
            if scan_uuid:
                # If a scan_uuid is provided, get a specific DynamicAnalysis instance for that user
                data = DynamicAnalysis.objects.filter(user_id=user.id, scan_uuid=scan_uuid)
                serializer = DynamicAnalysisSerializer(data, many=True)
                
                # If we have data and it contains Nuclei results, fetch the actual content
                if serializer.data and serializer.data[0].get('Nuclei_analysis_result'):
                    # Parse the S3 path to get bucket and key
                    s3_path = serializer.data[0]['Nuclei_analysis_result']
                    logger.info(f'Fetching scan results from S3 path: {s3_path}')
                    
                    if 's3://' in s3_path:
                        bucket_name = s3_path.split('://')[1].split('/')[0]
                        object_key = '/'.join(s3_path.split('://')[1].split('/')[1:])
                        
                        # Initialize S3Helper with the correct bucket
                        s3_helper = S3Helper(bucket_name=bucket_name)
                        
                        try:
                            # Get the object from S3 using S3Helper
                            download_result = s3_helper.download_file_obj(object_key)
                            if download_result['success']:
                                content = download_result['file_obj'].read().decode('utf-8')
                                logger.info(f"Successfully downloaded content, length: {len(content)}")
                                
                                # First, strip any leading/trailing whitespace
                                content = content.strip()
                                
                                # Try to parse as JSON directly first
                                try:
                                    scan_results = json.loads(content)
                                    logger.info("Successfully parsed JSON content directly")
                                except json.JSONDecodeError:
                                    # If direct parsing fails, try to find JSON array markers
                                    logger.info("Direct JSON parsing failed, looking for JSON array markers")
                                    json_start_marker = "["
                                    json_end_marker = "]"
                                    
                                    start_index = content.find(json_start_marker)
                                    end_index = content.rfind(json_end_marker)
                                    
                                    if start_index != -1 and end_index != -1 and end_index > start_index:
                                        # Extract just the JSON array
                                        json_content = content[start_index:end_index + 1]
                                        scan_results = json.loads(json_content)
                                        logger.info("Successfully parsed JSON using array markers")
                                    else:
                                        logger.error("Could not find valid JSON array markers in the content")
                                        scan_results = []
                                
                                # Update the response to include the actual content
                                result_data = serializer.data[0].copy()
                                result_data['scan_results'] = scan_results
                                result_data['Nuclei_analysis_result'] = s3_path  # Keep the original path for reference
                                
                                return Response([result_data], status=status.HTTP_200_OK)
                            else:
                                logger.error(f"Failed to download from S3: {download_result['message']}")
                                
                        except Exception as e:
                            logger.error(f"Error fetching Nuclei scan results from S3: {str(e)}")
                            # Log the first part of the content for debugging
                            if 'content' in locals():
                                logger.error(f"Content that failed to parse: {content[:200]}...")
                        
                # Return the serialized data as usual if no S3 content to fetch
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                # If no id is provided, get all DynamicAnalysis records for that user
                data = DynamicAnalysis.objects.filter(user_id=user.id)
                serializer = DynamicAnalysisSerializer(data, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    def post(self, request):
        try:
            user = request.user  # Get the currently authenticated user
            # Validate the input data using the DynamicAnalysisSerializer
            serializer = DynamicAnalysisSerializer(data=request.data)

            if serializer.is_valid():
                # Ensure 'project' is in the validated data before saving
                project_id = request.data.get('project')  # Get project from the request body
                if not project_id:
                    return Response({'message': 'Project ID is required'}, status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    # Get the Project instance based on the provided project ID
                    project = Project.objects.get(pk=project_id, user_id=user.id)
                    # Add the project to the validated data before saving
                    serializer.validated_data['user_id'] = user
                    serializer.validated_data['project'] = project  # Set the project field

                    # Create the DynamicAnalysis instance
                    dynamic_analysis = serializer.save()
                    # Optionally, you can start the analysis task here
                    NucleiTestingTask.delay(dynamic_analysis.id)

                    return Response(DynamicAnalysisSerializer(dynamic_analysis).data, status=status.HTTP_200_OK)
                except Project.DoesNotExist:
                    return Response({'message': 'Project not found or you do not have permission to access it'}, 
                                    status=status.HTTP_404_NOT_FOUND)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


    def patch(self, request, scan_uuid):
        try:
            user = request.user
            data = DynamicAnalysis.objects.get(scan_uuid=scan_uuid, user_id=user.id)

            serializer = DynamicAnalysisSerializer(data, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except DynamicAnalysis.DoesNotExist:
            return Response({'message': 'Not found or not authorized to update this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    # def delete(self, request, pk):
    #     try:
    #         data= DynamicAnalysis.objects.get(pk=pk)
    #         data.delete()
    #         return Response({'message':'Data deleted successfully'}, status=status.HTTP_200_OK)
    #     except Exception as e:
    #         return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)

class GroupedAnalysisView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, id=None):
        try:
            # Get user's projects with prefetched related analyses
            if not id:
                projects = Project.objects.filter(
                    user_id=request.user.id
                ).prefetch_related(
                    Prefetch('staticanalysis_set', queryset=StaticAnalysis.objects.all()),
                    Prefetch('dynamicanalysis_set', queryset=DynamicAnalysis.objects.all())
                )
                
                # Structure the response with projects as the top level
                result = []
                for project in projects:
                    # Serialize the static and dynamic analyses
                    static_analyses = StaticAnalysisSerializer(
                        project.staticanalysis_set.all(), 
                        many=True
                    ).data
                    
                    dynamic_analyses = DynamicAnalysisSerializer(
                        project.dynamicanalysis_set.all(), 
                        many=True
                    ).data
                    
                    # Add project data with its associated analyses
                    project_data = ProjectSerializer(project).data
                    project_data.update({
                        'static_analyses': static_analyses,
                        'dynamic_analyses': dynamic_analyses
                    })
                    
                    result.append(project_data)
                
                return Response(result, status=status.HTTP_200_OK)
            
            else:
                # Get a specific project with prefetched related analyses
                project = Project.objects.filter(
                    user_id=request.user.id, pk=id
                ).prefetch_related(
                    Prefetch('staticanalysis_set', queryset=StaticAnalysis.objects.all()),
                    Prefetch('dynamicanalysis_set', queryset=DynamicAnalysis.objects.all())
                ).first()
                
                if not project:
                    return Response({'message': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
                
                # Serialize the static and dynamic analyses
                static_analyses = StaticAnalysisSerializer(
                    project.staticanalysis_set.all(), 
                    many=True
                ).data
                
                dynamic_analyses = DynamicAnalysisSerializer(
                    project.dynamicanalysis_set.all(), 
                    many=True
                ).data
                
                # Add project data with its associated analyses
                project_data = ProjectSerializer(project).data
                project_data.update({
                    'static_analyses': static_analyses,
                    'dynamic_analyses': dynamic_analyses
                })
                
                return Response(project_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VulnerabilityAnalysisAPIView(APIView):
    authentication_classes = [JWTAuthentication]  # Assuming you're using JWT authentication
    permission_classes = [IsAuthenticated]

    def get(self, request, id=None):
        try:
            user = request.user  # Get the currently authenticated user
            
            if id:
                # If an id is provided, return a specific VulnerabilityAnalysis instance for the logged-in user
                data = VulnerabilityAnalysis.objects.filter(user_id=user.id, pk=id)
            else:
                # If no id is provided, return all VulnerabilityAnalysis records for the logged-in user
                data = VulnerabilityAnalysis.objects.filter(user_id=user.id)

            serializer = VulnerabilityAnalysisSerializer(data, many=True)
            if serializer.data:
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response({'message': 'VulnerabilityAnalysis record not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            # Assign the current user to the VulnerabilityAnalysis data
            data = request.data.copy()
            data['user_id'] = request.user.id  # Set the logged-in user's id

            serializer = VulnerabilityAnalysisSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        try:
            user = request.user
            # Ensure that the logged-in user can only update their own VulnerabilityAnalysis record
            data = VulnerabilityAnalysis.objects.get(pk=pk, user_id=user.id)  # Ensure the user is the owner of the record

            serializer = VulnerabilityAnalysisSerializer(data, data=request.data, partial=True)  # Use partial=True for patch
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except VulnerabilityAnalysis.DoesNotExist:
            return Response({'message': 'Not found or not authorized to update this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            user = request.user
            # Ensure that the logged-in user can only delete their own VulnerabilityAnalysis record
            data = VulnerabilityAnalysis.objects.get(pk=pk, user_id=user.id)  # Ensure the user is the owner of the record
            data.delete()
            return Response({'message': 'VulnerabilityAnalysis record deleted successfully'}, status=status.HTTP_200_OK)
        
        except VulnerabilityAnalysis.DoesNotExist:
            return Response({'message': 'Not found or not authorized to delete this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ReportAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, report_uuid=None):
        try:
            user = request.user  # Get the currently authenticated user
            
            if report_uuid:
                # If a report_uuid is provided, return a specific Report instance for the logged-in user
                report = Report.objects.filter(user_id=user.id, report_uuid=report_uuid).first()
                if not report:
                    return Response({'message': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)
                
                # Get the project data
                project = Project.objects.get(id=report.project_id.id)
                project_data = ProjectSerializer(project).data
                
                # Fetch the report content from S3
                if report.report_url and 's3://' in report.report_url:
                    try:
                        
                        # Parse the S3 path
                        s3_path = report.report_url
                        bucket_name = s3_path.split('://')[1].split('/')[0]
                        object_key = '/'.join(s3_path.split('://')[1].split('/')[1:])
                        
                        # Initialize S3Helper for reports
                        report_s3_helper = S3Helper(bucket_name=bucket_name)
                        
                        # Get the object from S3 using S3Helper
                        download_result = report_s3_helper.download_file_obj(object_key)
                        if download_result['success']:
                            content = download_result['file_obj'].read().decode('utf-8')
                            
                            # Parse the JSON content
                            report_content = json.loads(content)
                        
                        # Create the response with report content and project data
                        report_data = ReportSerializer(report).data
                        report_data['report_content'] = report_content
                        report_data['project'] = project_data
                        
                        # Remove project_id as we now include full project data
                        if 'project_id' in report_data:
                            del report_data['project_id']
                        
                        return Response(report_data, status=status.HTTP_200_OK)
                        
                    except Exception as e:
                        logger.error(f"Error fetching report content from S3: {str(e)}")
                        # If we can't fetch the content, return basic info
                        report_data = ReportSerializer(report).data
                        report_data['project'] = project_data
                        if 'project_id' in report_data:
                            del report_data['project_id']
                        return Response(report_data, status=status.HTTP_200_OK)
                else:
                    # If no S3 URL, return basic info
                    report_data = ReportSerializer(report).data
                    report_data['project'] = project_data
                    if 'project_id' in report_data:
                        del report_data['project_id']
                    return Response(report_data, status=status.HTTP_200_OK)
            else:
                # If no id is provided, return all Report records for the logged-in user
                reports = Report.objects.filter(user_id=user.id)
                result_data = []
                
                for report in reports:
                    # Get project data for each report
                    project = Project.objects.get(id=report.project_id.id)
                    project_data = ProjectSerializer(project).data
                    
                    # Create report data with project info
                    report_data = ReportSerializer(report).data
                    report_data['project'] = project_data
                    
                    # Remove project_id as we now include full project data
                    if 'project_id' in report_data:
                        del report_data['project_id']
                    
                    result_data.append(report_data)
                
                if result_data:
                    return Response(result_data, status=status.HTTP_200_OK)
                return Response({'message': 'No reports found'}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        
    def post(self, request):
        try:
            # Assign the current user to the request data
            user = request.user
            project_id = request.data.get('project_id')
            organization_id = request.data.get('organization_id')
            
            if not project_id:
                return Response({'message': 'project_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not organization_id:
                return Response({'message': 'organization_id is required'}, status=status.HTTP_400_BAD_REQUEST)
                    
            # Verify the user has access to this project
            try:
                project = Project.objects.get(id=project_id, user_id=user.id)
            except Project.DoesNotExist:
                return Response({'message': 'Project not found or you do not have permission to access it'}, 
                              status=status.HTTP_404_NOT_FOUND)
            
            # Verify the organization exists
            try:
                organization = Organization.objects.get(id=organization_id)
            except Organization.DoesNotExist:
                return Response({'message': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Get the latest static analysis for this project
            latest_static_analysis = StaticAnalysis.objects.filter(
                user_id=user.id, 
                project=project_id
            ).order_by('-created_at').first()
            
            # Get the latest dynamic analysis for this project
            latest_dynamic_analysis = DynamicAnalysis.objects.filter(
                user_id=user.id, 
                project=project_id
            ).order_by('-created_at').first()

            logger.info(f"Latest Static Analysis: {latest_static_analysis}")
            print(f"Latest Static Analysis: {latest_static_analysis}")

            logger.info(f"Latest Dynamic Analysis: {latest_dynamic_analysis}")
            print(f"Latest Dynamic Analysis: {latest_dynamic_analysis}")

            if not latest_static_analysis and not latest_dynamic_analysis:
                return Response({'message': 'No analysis data found for this project'}, status=status.HTTP_404_NOT_FOUND)   
            
            # Process static analysis results if available
            static_data = None
            if latest_static_analysis and latest_static_analysis.LLM_analysis_result and 's3://' in latest_static_analysis.LLM_analysis_result:
                try:
                    # Parse the S3 path
                    s3_path = latest_static_analysis.LLM_analysis_result
                    bucket_name = s3_path.split('://')[1].split('/')[0]
                    object_key = '/'.join(s3_path.split('://')[1].split('/')[1:])
                    
                    # Initialize S3Helper for static analysis results
                    static_s3_helper = S3Helper(bucket_name=bucket_name)
                    
                    # Get the object from S3 using S3Helper
                    download_result = static_s3_helper.download_file_obj(object_key)
                    if download_result['success']:
                        content = download_result['file_obj'].read().decode('utf-8')
                        
                        # Parse the JSON content
                        content_data = json.loads(content)
                    
                    # Transform the data to the expected format
                    transformed_data = []
                    
                    for entry in content_data:
                        try:
                            # Check if entry is a dictionary
                            if isinstance(entry, dict):
                                # Get the raw_response (which is a string)
                                raw_response_str = entry.get('raw_response', '{}')
                                
                                # Replace escaped backslashes (\\) with a temporary placeholder
                                fixed_str = raw_response_str.replace('\\\\', '##BACKSLASH##')
                                # Replace any remaining problematic escapes
                                fixed_str = fixed_str.replace('\\_', '_')
                                # Put back the proper backslashes
                                fixed_str = fixed_str.replace('##BACKSLASH##', '\\')
                                
                                # Parse the fixed JSON string
                                raw_response = json.loads(fixed_str)
                                
                                # Extract vulnerabilities
                                vulnerabilities = raw_response.get('vulnerabilities', [])
                                
                                # Convert each vulnerability to the expected format
                                for vuln in vulnerabilities:
                                    # Parse location which might be in string format like "/path/to/file:line"
                                    location_str = vuln.get('location', '')
                                    file_path = ''
                                    line_number = None
                                    
                                    # Handle location whether it's a string or dictionary
                                    if isinstance(location_str, str) and ':' in location_str:
                                        # Split location string into file path and line number
                                        parts = location_str.split(':')
                                        file_path = parts[0]
                                        # Try to parse line number
                                        try:
                                            line_number = int(parts[1])
                                        except (IndexError, ValueError):
                                            line_number = None
                                    elif isinstance(location_str, dict):
                                        # If location is already a dictionary, extract values
                                        file_path = location_str.get('file_path', '')
                                        line_number = location_str.get('line_number')
                                    
                                    # Fix file_path to remove any escape characters
                                    if file_path:
                                        file_path = file_path.replace('\\_', '_')
                                    
                                    # Create transformed vulnerability with the expected format
                                    transformed_vuln = {
                                        "id": vuln.get('id', ''),
                                        "title": vuln.get('title', ''),
                                        "severity": vuln.get('severity', ''),
                                        "description": vuln.get('description', ''),
                                        "location": {
                                            "filePath": file_path,
                                            "lineNumber": line_number
                                        },
                                        "fix": vuln.get('fix', ''),
                                        "tips": vuln.get('tips', '')
                                    }
                                    transformed_data.append(transformed_vuln)
                        except Exception as e:
                            logger.error(f"Error processing static analysis entry: {str(e)}")
                            continue
                    
                    static_data = transformed_data
                    
                except Exception as e:
                    logger.error(f"Error fetching LLM analysis results: {str(e)}")
            
            # Process dynamic analysis results if available
            dynamic_data = None
            if latest_dynamic_analysis and latest_dynamic_analysis.Nuclei_analysis_result and 's3://' in latest_dynamic_analysis.Nuclei_analysis_result:
                try:
                    # Parse the S3 path
                    s3_path = latest_dynamic_analysis.Nuclei_analysis_result
                    bucket_name = s3_path.split('://')[1].split('/')[0]
                    object_key = '/'.join(s3_path.split('://')[1].split('/')[1:])
                    
                    # Initialize S3Helper for dynamic analysis results
                    dynamic_s3_helper = S3Helper(bucket_name=bucket_name)
                    
                    # Get the object from S3 using S3Helper
                    download_result = dynamic_s3_helper.download_file_obj(object_key)
                    if download_result['success']:
                        content = download_result['file_obj'].read().decode('utf-8')
                    
                    # First, strip any leading/trailing whitespace
                    content = content.strip()
                    
                    # Find the actual JSON content regardless of formatting
                    json_start_marker = "["
                    json_end_marker = "]"
                    
                    start_index = content.find(json_start_marker)
                    end_index = content.rfind(json_end_marker)
                    
                    if start_index != -1 and end_index != -1 and end_index > start_index:
                        # Extract just the JSON array
                        json_content = content[start_index:end_index + 1]
                        
                        # Now parse the JSON
                        dynamic_data = json.loads(json_content)
                    else:
                        logger.error("Could not find valid JSON array markers in the content")
                        
                except Exception as e:
                    logger.error(f"Error fetching Nuclei scan results: {str(e)}")
            
            # Combine data for LLM processing
            jsonfilesdata = {
                "static_analysis": static_data,
                "dynamic_analysis": dynamic_data,
                "project_info": {
                    "name": project.project_name,
                    "id": project_id
                }
            }
            
            # Prepare data for LLM API
            llm_prompt = f"""
            {json.dumps(jsonfilesdata)}
            You will be given one or more JSON inputs containing results from security scans. Based on the combined data, generate a single, unified security summary report in **JSON format only** with the following structure: {{"project_summary": {{"total_issues": <integer>, "high_severity": <integer>, "medium_severity": <integer>, "low_severity": <integer>, "info": <integer>, "warnings": <integer>, "status": "<string - 'Secure', 'Partially Secure', or 'Vulnerable'>"}}, "detailed_findings": [{{"id": "<optional - vulnerability id if exists>", "title": "<short title of issue>", "description": "<detailed explanation>", "severity": "<High | Medium | Low | Info | Warning>", "location": {{"file_path": "<file or URL>", "line_number": <line number or null>}}, "recommendation": "<how to fix it>", "reference": "<tip or best practice>"}}, ...], "meta": {{"report_generated_at": "<ISO8601 timestamp>", "source_files_scanned": <integer>, "scan_notes": ["<any additional warnings or info found>", ...]}}}} Only return the final merged JSON following the above structure. Do not include any explanations or non-JSON output.
            """
            
            # Call the LLM API
            
            llm_api_url = AppConfig.LLM_API_URL
            
            payload = {
                "model": "lily-cybersecurity-7b-v0.2",
                "messages": [
                    {"role": "user", "content": llm_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": -1,
                "stream": False
            }
            
            try:
                llm_response = requests.post(
                    llm_api_url,
                    headers={"Content-Type": "application/json"},
                    json=payload
                )
                
                if llm_response.status_code == 200:
                    llm_result = llm_response.json()
                    report_content = llm_result.get("choices", [{}])[0].get("message", {}).get("content", "{}")
                    
                    # Define the bucket name
                    s3_bucket = getattr(AppConfig, 'REPORTS_BUCKET', 'repo-reports')
                    
                    # Initialize S3Helper for reports
                    reports_s3_helper = S3Helper(bucket_name=s3_bucket)
                    
                    # Save LLM response to S3
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    s3_object_key = f"reports/{project_id}_{timestamp}_report.json"
                    
                    # Create a temporary file with the report content
                    import tempfile
                    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as tmp_file:
                        tmp_file.write(report_content)
                        tmp_file_path = tmp_file.name
                    
                    try:
                        # Upload to S3 using S3Helper
                        upload_result = reports_s3_helper.upload_file(tmp_file_path, s3_object_key)
                        if upload_result['success']:
                            logger.info(f"Report uploaded successfully to {s3_bucket}/{s3_object_key}")
                        else:
                            logger.error(f"Failed to upload report: {upload_result['message']}")
                    finally:
                        # Clean up temporary file
                        import os
                        if os.path.exists(tmp_file_path):
                            os.unlink(tmp_file_path)
                    
                    # Create report URL
                    report_url = f"s3://{s3_bucket}/{s3_object_key}"
                    
                    # Create a Report entry
                    report = Report.objects.create(
                        user_id=user,
                        project_id=project,
                        organization_id=organization,
                        report_url=report_url
                    )
                    
                    # Return combined results with report ID
                    return Response({
                        "message": "Report generated successfully",
                        "report_id": report.id,
                        "report_url": report_url
                    }, status=status.HTTP_200_OK)
                else:
                    logger.error(f"LLM API error: {llm_response.text}")
                    return Response({
                        "message": "Failed to generate report from LLM API",
                        "error": llm_response.text
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
            except Exception as e:
                logger.error(f"Error calling LLM API: {str(e)}")
                return Response({
                    "message": "Error generating report",
                    "error": str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, report_uuid):
        try:
            user = request.user
            # Ensure that the logged-in user can only update their own Report record
            data = Report.objects.get(report_uuid=report_uuid, user_id=user.id)  # Ensure the user is the owner of the record

            serializer = ReportSerializer(data, data=request.data, partial=True)  # Use partial=True for patch
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Report.DoesNotExist:
            return Response({'message': 'Not found or not authorized to update this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, report_uuid):
        try:
            user = request.user
            # Ensure that the logged-in user can only delete their own Report record
            data = Report.objects.get(report_uuid=report_uuid, user_id=user.id)  # Ensure the user is the owner of the record
            data.delete()
            return Response({'message': 'Report record deleted successfully'}, status=status.HTTP_200_OK)
        
        except Report.DoesNotExist:
            return Response({'message': 'Not found or not authorized to delete this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SecurityPolicyAPIView(APIView):
    authentication_classes = [JWTAuthentication]  # If JWT authentication is enabled
    permission_classes = [IsAuthenticated]

    def get(self, request, id=None):
        try:
            user = request.user  # Get the currently authenticated user
            
            if id:
                # If an id is provided, return the specific SecurityPolicy record for the logged-in user
                data = SecurityPolicy.objects.filter(user_id=user.id, pk=id)
            else:
                # If no id is provided, return all SecurityPolicy records for the logged-in user
                data = SecurityPolicy.objects.filter(user_id=user.id)

            serializer = SecurityPolicySerializer(data, many=True)
            if serializer.data:
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response({'message': 'SecurityPolicy record not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            # Assign the logged-in user to the SecurityPolicy record
            data = request.data.copy()  # Make a copy of the data
            data['user_id'] = request.user.id  # Set the logged-in user's ID
            
            serializer = SecurityPolicySerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        try:
            user = request.user
            # Ensure that the logged-in user can only update their own SecurityPolicy record
            data = SecurityPolicy.objects.get(pk=pk, user_id=user.id)  # Check if the user owns the record
            
            serializer = SecurityPolicySerializer(data, data=request.data, partial=True)  # Use partial=True for PATCH
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except SecurityPolicy.DoesNotExist:
            return Response({'message': 'Not found or not authorized to update this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            user = request.user
            # Ensure that the logged-in user can only delete their own SecurityPolicy record
            data = SecurityPolicy.objects.get(pk=pk, user_id=user.id)  # Check if the user owns the record
            data.delete()
            return Response({'message': 'SecurityPolicy record deleted successfully'}, status=status.HTTP_200_OK)
        
        except SecurityPolicy.DoesNotExist:
            return Response({'message': 'Not found or not authorized to delete this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SecurityAlertAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, id=None):
        try:
            user = request.user  # Get the currently authenticated user
            
            if id:
                # If an id is provided, return the specific SecurityAlert record for the logged-in user
                data = SecurityAlert.objects.filter(user_id=user.id, pk=id)
            else:
                # If no id is provided, return all SecurityAlert records for the logged-in user
                data = SecurityAlert.objects.filter(user_id=user.id)

            serializer = SecurityAlertSerializer(data, many=True)
            if serializer.data:
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response({'message': 'SecurityAlert record not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            # Assign the logged-in user to the SecurityAlert record
            data = request.data.copy()  # Make a copy of the data
            data['user_id'] = request.user.id  # Set the logged-in user's ID
            
            serializer = SecurityAlertSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        try:
            user = request.user
            # Ensure that the logged-in user can only update their own SecurityAlert record
            data = SecurityAlert.objects.get(pk=pk, user_id=user.id)  # Check if the user owns the record
            
            serializer = SecurityAlertSerializer(data, data=request.data, partial=True)  # Use partial=True for PATCH
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except SecurityAlert.DoesNotExist:
            return Response({'message': 'Not found or not authorized to update this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            user = request.user
            # Ensure that the logged-in user can only delete their own SecurityAlert record
            data = SecurityAlert.objects.get(pk=pk, user_id=user.id)  # Check if the user owns the record
            data.delete()
            return Response({'message': 'SecurityAlert record deleted successfully'}, status=status.HTTP_200_OK)
        
        except SecurityAlert.DoesNotExist:
            return Response({'message': 'Not found or not authorized to delete this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SupportTicketAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, id=None):
        try:
            user = request.user  # Get the currently authenticated user

            if id:
                # If an id is provided, return the specific SupportTicket record for the logged-in user
                data = SupportTicket.objects.filter(user_id=user.id, pk=id)
            else:
                # If no id is provided, return all SupportTicket records for the logged-in user
                data = SupportTicket.objects.filter(user_id=user.id)

            serializer = SupportTicketSerializer(data, many=True)
            if serializer.data:
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response({'message': 'SupportTicket record not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            # Assign the logged-in user to the SupportTicket record
            data = request.data.copy()  # Make a copy of the data
            data['user_id'] = request.user.id  # Set the logged-in user's ID
            
            serializer = SupportTicketSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        try:
            user = request.user
            # Ensure that the logged-in user can only update their own SupportTicket record
            data = SupportTicket.objects.get(pk=pk, user_id=user.id)  # Check if the user owns the record
            
            serializer = SupportTicketSerializer(data, data=request.data, partial=True)  # Use partial=True for PATCH
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except SupportTicket.DoesNotExist:
            return Response({'message': 'Not found or not authorized to update this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            user = request.user
            # Ensure that the logged-in user can only delete their own SupportTicket record
            data = SupportTicket.objects.get(pk=pk, user_id=user.id)  # Check if the user owns the record
            data.delete()
            return Response({'message': 'SupportTicket record deleted successfully'}, status=status.HTTP_200_OK)
        
        except SupportTicket.DoesNotExist:
            return Response({'message': 'Not found or not authorized to delete this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SupportChatAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, id=None):
        try:
            user = request.user  # Get the currently authenticated user

            if id:
                # If an id is provided, return the specific SupportChat record for the logged-in user
                data = SupportChat.objects.filter(user_id=user.id, pk=id)
            else:
                # If no id is provided, return all SupportChat records for the logged-in user
                data = SupportChat.objects.filter(user_id=user.id)

            serializer = SupportChatSerializer(data, many=True)
            if serializer.data:
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response({'message': 'SupportChat record not found'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            # Assign the logged-in user to the SupportChat record
            data = request.data.copy()  # Make a copy of the data
            data['user_id'] = request.user.id  # Set the logged-in user's ID

            serializer = SupportChatSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        try:
            user = request.user
            # Ensure that the logged-in user can only update their own SupportChat record
            data = SupportChat.objects.get(pk=pk, user_id=user.id)  # Check if the user owns the record

            serializer = SupportChatSerializer(data, data=request.data, partial=True)  # Use partial=True for PATCH
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except SupportChat.DoesNotExist:
            return Response({'message': 'Not found or not authorized to update this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            user = request.user
            # Ensure that the logged-in user can only delete their own SupportChat record
            data = SupportChat.objects.get(pk=pk, user_id=user.id)  # Check if the user owns the record
            data.delete()
            return Response({'message': 'SupportChat record deleted successfully'}, status=status.HTTP_200_OK)

        except SupportChat.DoesNotExist:
            return Response({'message': 'Not found or not authorized to delete this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class NotificationAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, id=None):
        try:
            user = request.user  # Get the currently authenticated user

            if id:
                # If an id is provided, return the specific Notification record for the logged-in user
                data = Notification.objects.filter(user_id=user.id, pk=id)
            else:
                # If no id is provided, return all Notification records for the logged-in user
                data = Notification.objects.filter(user_id=user.id)

            serializer = NotificationSerializer(data, many=True)
            if serializer.data:
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response({'message': 'Notification not found'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            # Assign the logged-in user to the Notification record
            data = request.data.copy()  # Make a copy of the data
            data['user_id'] = request.user.id  # Set the logged-in user's ID

            serializer = NotificationSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        try:
            user = request.user
            # Ensure that the logged-in user can only update their own Notification record
            data = Notification.objects.get(pk=pk, user_id=user.id)  # Check if the user owns the record

            serializer = NotificationSerializer(data, data=request.data, partial=True)  # Use partial=True for PATCH
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Notification.DoesNotExist:
            return Response({'message': 'Not found or not authorized to update this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            user = request.user
            # Ensure that the logged-in user can only delete their own Notification record
            data = Notification.objects.get(pk=pk, user_id=user.id)  # Check if the user owns the record
            data.delete()
            return Response({'message': 'Notification record deleted successfully'}, status=status.HTTP_200_OK)

        except Notification.DoesNotExist:
            return Response({'message': 'Not found or not authorized to delete this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class DashboardAnalyticsAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, id=None):
        try:
            user = request.user  # Get the currently authenticated user

            if id:
                # If an id is provided, return the specific DashboardAnalytics record for the logged-in user
                data = DashboardAnalytics.objects.filter(user_id=user.id, pk=id)
            else:
                # If no id is provided, return all DashboardAnalytics records for the logged-in user
                data = DashboardAnalytics.objects.filter(user_id=user.id)

            serializer = DashboardAnalyticsSerializer(data, many=True)
            if serializer.data:
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response({'message': 'No data found'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            # Assign the logged-in user to the DashboardAnalytics record
            data = request.data.copy()  # Make a copy of the data
            data['user_id'] = request.user.id  # Set the logged-in user's ID

            serializer = DashboardAnalyticsSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        try:
            user = request.user
            # Ensure that the logged-in user can only update their own DashboardAnalytics record
            data = DashboardAnalytics.objects.get(pk=pk, user_id=user.id)  # Check if the user owns the record

            serializer = DashboardAnalyticsSerializer(data, data=request.data, partial=True)  # Use partial=True for PATCH
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except DashboardAnalytics.DoesNotExist:
            return Response({'message': 'Not found or not authorized to update this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            user = request.user
            # Ensure that the logged-in user can only delete their own DashboardAnalytics record
            data = DashboardAnalytics.objects.get(pk=pk, user_id=user.id)  # Check if the user owns the record
            data.delete()
            return Response({'message': 'DashboardAnalytics record deleted successfully'}, status=status.HTTP_200_OK)

        except DashboardAnalytics.DoesNotExist:
            return Response({'message': 'Not found or not authorized to delete this record.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PricingPlanAPIView(APIView):
    # authentication_classes=[JWTAuthentication]
    # permission_classes=[IsAuthenticated]
    def get(self, request,id):
        try:
            data= PricingPlan.objects.filter(user_id=id)
            serializer= PricingPlanSerializer(data, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def post(self, request):
        try:
            serializer= PricingPlanSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    # def put(self, request, pk):
    #     try:
    #         data= PricingPlan.objects.get(pk=pk)
    #         serializer= PricingPlanSerializer(data, data=request.data)
    #         if serializer.is_valid():
    #             serializer.save()
    #             return Response(serializer.data, status=status.HTTP_200_OK)
    #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    #     except Exception as e:
    #         return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    # def delete(self, request, pk):
    #     try:
    #         data= PricingPlan.objects.get(pk=pk)
    #         data.delete()
    #         return Response({'message':'Data deleted successfully'}, status=status.HTTP_200_OK)
    #     except Exception as e:
    #         return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SubscriptionAPIView(APIView):
    # authentication_classes=[JWTAuthentication]
    # permission_classes=[IsAuthenticated]
    def get(self, request,id):
        try:
            data= Subscription.objects.filter(user_id=id)
            serializer= SubscriptionSerializer(data, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def post(self, request):
        try:
            serializer= SubscriptionSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    # def put(self, request, pk):
    #     try:
    #         data= Subscription.objects.get(pk=pk)
    #         serializer= SubscriptionSerializer(data, data=request.data)
    #         if serializer.is_valid():
    #             serializer.save()
    #             return Response(serializer.data, status=status.HTTP_200_OK)
    #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    #     except Exception as e:
    #         return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    # def delete(self, request, pk):
    #     try:
    #         data= Subscription.objects.get(pk=pk)
    #         data.delete()
    #         return Response({'message':'Data deleted successfully'}, status=status.HTTP_200_OK)
    #     except Exception as e:
    #         return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PaymentAPIView(APIView):
    # authentication_classes=[JWTAuthentication]
    # permission_classes=[IsAuthenticated]
    def get(self, request,id):
        try:
            data= Payment.objects.filter(user_id=id)
            serializer= PaymentSerializer(data, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def post(self, request):
        try:
            serializer= PaymentSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    # def put(self, request, pk):
    #     try:
    #         data= Payment.objects.get(pk=pk)
    #         serializer= PaymentSerializer(data, data=request.data)
    #         if serializer.is_valid():
    #             serializer.save()
    #             return Response(serializer.data, status=status.HTTP_200_OK)
    #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    #     except Exception as e:
    #         return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    # def delete(self, request, pk):
    #     try:
    #         data= Payment.objects.get(pk=pk)
    #         data.delete()
    #         return Response({'message':'Data deleted successfully'}, status=status.HTTP_200_OK)
    #     except Exception as e:
    #         return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TestingAPIView(APIView):
    # authentication_classes=[JWTAuthentication]
    # permission_classes=[IsAuthenticated]
    def get(self, request,id):
        try:
            data= Testing.objects.filter(user_id=id)
            serializer= TestingSerializer(data, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def post(self, request):
        try:
            if request.data.get('user_id') is None or request.data.get('user_id') == '':
                return Response({'message':'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            elif request.data.get('project_id') is None or request.data.get('project_id') == '':
                return Response({'message':'project_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            elif request.data.get('source_url') is None or request.data.get('source_url') == '':
                return Response({'message':'source_url is required'}, status=status.HTTP_400_BAD_REQUEST)
            elif request.data.get('repo_username') is None or request.data.get('repo_username') == '':
                return Response({'message':'repo_username is required'}, status=status.HTTP_400_BAD_REQUEST)
            elif request.data.get('repo_token') is None or request.data.get('repo_token') == '':
                return Response({'message':'repo_token is required'}, status=status.HTTP_400_BAD_REQUEST)
            elif request.data.get('repo_type') is None or request.data.get('repo_type') == '':
                return Response({'message':'repo_type is required'}, status=status.HTTP_400_BAD_REQUEST)
            elif request.data.get('testing_type') is None or request.data.get('testing_type') == '':
                return Response({'message':'testing_type is required'}, status=status.HTTP_400_BAD_REQUEST)
            elif request.data.get('testing_type') not in ['LLM', 'Nuclei', 'CVEscan']:
                return Response({'message':'Invalid testing type'}, status=status.HTTP_400_BAD_REQUEST)
            elif request.data.get('repo_type') not in ['Github', 'Gitlab', 'Bitbucket']:
                return Response({'message':'Invalid repo type'}, status=status.HTTP_400_BAD_REQUEST)
            
            user_obj= User.objects.get(pk=request.data.get('user_id'))
            project_obj= Project.objects.get(pk=request.data.get('project_id'))
            # save data to database
            testing_obj = Testing.objects.create(
                user_id= user_obj,
                project_id= project_obj,
                testing_type= request.data.get('testing_type'),
                source_url= request.data.get('source_url')
            )
            testing_id = testing_obj.pk 
            request.data['test_id'] = testing_id
            if request.data.get('testing_type') == 'LLM' or request.data.get('testing_type') == 'GitLeaks' or request.data.get('testing_type') == 'CVEscan':
                CloneRepoTask.delay(json.dumps(request.data))
            elif request.data.get('testing_type') == 'Nuclei':
                NucleiTestingTask.delay(json.dumps(request.data))
            
            return Response({'message':'Data saved successfully'}, status=status.HTTP_200_OK)
            

            # old code
            # serializer= TestingSerializer(data=request.data)
            # if serializer.is_valid():
            #     serializer.save()
            #     # check the testing type

            #     # if testing type is LLM or gitleaks then call LLMtesting background task
            #     if request.data.get('testing_type') == 'LLM':
            #         CloneRepoTask.delay(serializer.data)
                    

            #     # if testing type is Nuclei then call NucleiTesting background task
            #     elif request.data.get('testing_type') == 'Nuclei':
            #         NucleiTestingTask.delay(serializer.data)

            #     serializer.save()
            #     return Response(serializer.data, status=status.HTTP_200_OK)
            # return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    # def put(self, request, pk):
    #     try:
    #         data= Testing.objects.get(pk=pk)
    #         serializer= TestingSerializer(data, data=request.data)
    #         if serializer.is_valid():
    #             serializer.save()
    #             return Response(serializer.data, status=status.HTTP_200_OK)
    #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    #     except Exception as e:
    #         return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    # def delete(self, request, pk):
    #     try:
    #         data= Testing.objects.get(pk=pk)
    #         data.delete()
    #         return Response({'message':'Data deleted successfully'}, status=status.HTTP_200_OK)
    #     except Exception as e:
    #         return Response({'message':str(e)}, status=status.HTTP_400_BAD_REQUEST)


class JoinEarlyAccessAPIView(APIView):
    def post(self, request):
        try:
            serializer = EarlyAccessUserSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                # Send confirmation email
                sendWaitlistEmailTask.delay(request.data.get('email'))
                return Response({"message": "You have successfully joined the waitlist!"}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class ContactFormAPIView(APIView):
    def post(self, request):
        try:
            serializer = ContactFormSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                sendContactFormTask.delay(serializer.data)
                return Response({'message': 'Your message has been sent successfully'}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

class MobileAppAnalysisAPIView(APIView):
    """
    API View for Mobile App (APK/IPA) security analysis.
    
    GET: Retrieve all mobile app analyses for the user, or a specific one with full results.
    POST: Upload a mobile app file and trigger security analysis.
    PATCH: Update a mobile app analysis record.
    DELETE: Delete a mobile app analysis record.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, scan_uuid=None):
        """
        GET method to retrieve mobile app analysis records.
        
        If scan_uuid is provided: Returns specific record with full vulnerability JSON from S3.
        If no scan_uuid: Returns all records for the user (without full vulnerability data).
        """
        try:
            user = request.user
            
            if scan_uuid:
                # Get specific MobileAppAnalysis with full results from S3
                data = MobileAppAnalysis.objects.filter(user_id=user.id, scan_uuid=scan_uuid).first()
                
                if not data:
                    return Response(
                        {'message': 'MobileAppAnalysis record not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                serializer = MobileAppAnalysisSerializer(data)
                result_data = serializer.data.copy()
                
                # Fetch analysis results from S3 if available
                if data.analysis_result and 's3://' in data.analysis_result:
                    try:
                        # Parse the S3 path
                        s3_path = data.analysis_result
                        bucket_name = s3_path.split('://')[1].split('/')[0]
                        object_key = '/'.join(s3_path.split('://')[1].split('/')[1:])
                        
                        # Initialize S3Helper
                        s3_helper = S3Helper(bucket_name=bucket_name)
                        
                        # Download and parse the JSON results
                        download_result = s3_helper.download_file_obj(object_key)
                        if download_result['success']:
                            content = download_result['file_obj'].read().decode('utf-8')
                            analysis_content = json.loads(content)
                            
                            # Replace S3 path with actual content
                            result_data['analysis_result'] = analysis_content
                        else:
                            logger.error(f"Failed to download analysis results: {download_result['message']}")
                            
                    except Exception as e:
                        logger.error(f"Error fetching analysis results from S3: {str(e)}")
                        # Keep the S3 path in case of error
                
                return Response(result_data, status=status.HTTP_200_OK)
            
            else:
                # Get all MobileAppAnalysis records for the user (without S3 content)
                data = MobileAppAnalysis.objects.filter(user_id=user.id)
                serializer = MobileAppAnalysisSerializer(data, many=True)
                
                if serializer.data:
                    return Response(serializer.data, status=status.HTTP_200_OK)
                return Response(
                    {'message': 'No MobileAppAnalysis records found'},
                    status=status.HTTP_200_OK
                )
                
        except Exception as e:
            logger.error(f"Error in MobileAppAnalysisAPIView GET: {str(e)}")
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        """
        POST method to create a new mobile app analysis.
        
        Required fields:
        - project: Project ID
        - app_file: The APK or IPA file to analyze
        
        Optional fields:
        - app_name: Name of the app (auto-detected from filename if not provided)
        """
        try:
            user = request.user
            
            # Validate required fields
            project_id = request.data.get('project')
            app_file = request.FILES.get('app_file')
            
            if not project_id:
                return Response(
                    {'message': 'project is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not app_file:
                return Response(
                    {'message': 'app_file is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate file extension
            file_name = app_file.name.lower()
            if not file_name.endswith(('.apk', '.ipa')):
                return Response(
                    {'message': 'Invalid file type. Only .apk and .ipa files are supported.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Determine app type from extension
            app_type = 'APK' if file_name.endswith('.apk') else 'IPA'
            
            # Verify project belongs to user
            try:
                project = Project.objects.get(id=project_id, user_id=user.id)
            except Project.DoesNotExist:
                return Response(
                    {'message': 'Project not found or you do not have permission to access it'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get app name from request or filename
            app_name = request.data.get('app_name', '')
            if not app_name:
                app_name = os.path.splitext(app_file.name)[0]
            
            # Create MobileAppAnalysis record
            mobile_analysis = MobileAppAnalysis.objects.create(
                user_id=user,
                project=project,
                app_name=app_name,
                app_type=app_type,
                app_file=app_file,
                file_size=app_file.size,
                mobile_app_analysis_status='Uploading'
            )
            
            # Update status to Waiting before triggering task
            mobile_analysis.mobile_app_analysis_status = 'Waiting'
            mobile_analysis.save()
            
            # Trigger the analysis task
            MobileAppAnalysisTask.delay(mobile_analysis.id)
            
            # Return the created record
            serializer = MobileAppAnalysisSerializer(mobile_analysis)
            return Response(
                {
                    'message': 'Mobile app analysis initiated successfully',
                    'data': serializer.data
                },
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            logger.error(f"Error in MobileAppAnalysisAPIView POST: {str(e)}")
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # def patch(self, request, scan_uuid):
    #     """
    #     PATCH method to update a mobile app analysis record.
    #     Only allows updating certain fields like app_name.
    #     """
    #     try:
    #         user = request.user
            
    #         # Get the record ensuring user owns it
    #         try:
    #             mobile_analysis = MobileAppAnalysis.objects.get(scan_uuid=scan_uuid, user_id=user.id)
    #         except MobileAppAnalysis.DoesNotExist:
    #             return Response(
    #                 {'message': 'Not found or not authorized to update this record.'},
    #                 status=status.HTTP_404_NOT_FOUND
    #             )
            
    #         # Only allow updating certain fields
    #         allowed_fields = ['app_name']
    #         update_data = {k: v for k, v in request.data.items() if k in allowed_fields}
            
    #         serializer = MobileAppAnalysisSerializer(
    #             mobile_analysis,
    #             data=update_data,
    #             partial=True
    #         )
            
    #         if serializer.is_valid():
    #             serializer.save()
    #             return Response(serializer.data, status=status.HTTP_200_OK)
    #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    #     except Exception as e:
    #         logger.error(f"Error in MobileAppAnalysisAPIView PATCH: {str(e)}")
    #         return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # def delete(self, request, scan_uuid):
    #     """
    #     DELETE method to remove a mobile app analysis record.
    #     Also removes the associated app file.
    #     """
    #     try:
    #         user = request.user
            
    #         # Get the record ensuring user owns it
    #         try:
    #             mobile_analysis = MobileAppAnalysis.objects.get(scan_uuid=scan_uuid, user_id=user.id)
    #         except MobileAppAnalysis.DoesNotExist:
    #             return Response(
    #                 {'message': 'Not found or not authorized to delete this record.'},
    #                 status=status.HTTP_404_NOT_FOUND
    #             )
            
    #         # Delete the associated file if it exists
    #         if mobile_analysis.app_file:
    #             try:
    #                 if os.path.exists(mobile_analysis.app_file.path):
    #                     os.remove(mobile_analysis.app_file.path)
    #             except Exception as file_error:
    #                 logger.warning(f"Failed to delete app file: {str(file_error)}")
            
    #         # Delete the record
    #         mobile_analysis.delete()
            
    #         return Response(
    #             {'message': 'MobileAppAnalysis record deleted successfully'},
    #             status=status.HTTP_200_OK
    #         )
            
    #     except Exception as e:
    #         logger.error(f"Error in MobileAppAnalysisAPIView DELETE: {str(e)}")
    #         return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BrowserExtensionAnalysisAPIView(APIView):
    """
    API View for Browser Extension security analysis.
    
    Supports Chrome (.crx), Firefox (.xpi), Safari (.safariextz), and generic (.zip) extensions.
    
    GET: Retrieve all browser extension analyses for the user, or a specific one with full results.
    POST: Upload a browser extension file and trigger security analysis.
    PATCH: Update a browser extension analysis record.
    DELETE: Delete a browser extension analysis record.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, scan_uuid=None):
        """
        GET method to retrieve browser extension analysis records.
        
        If scan_uuid is provided: Returns specific record with full vulnerability JSON from S3.
        If no scan_uuid: Returns all records for the user (without full vulnerability data).
        """
        try:
            user = request.user
            
            if scan_uuid:
                # Get specific BrowserExtensionAnalysis with full results from S3
                data = BrowserExtensionAnalysis.objects.filter(user_id=user.id, scan_uuid=scan_uuid).first()
                
                if not data:
                    return Response(
                        {'message': 'BrowserExtensionAnalysis record not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                serializer = BrowserExtensionAnalysisSerializer(data)
                result_data = serializer.data.copy()
                
                # Fetch analysis results from S3 if available
                if data.analysis_result and 's3://' in data.analysis_result:
                    try:
                        # Parse the S3 path
                        s3_path = data.analysis_result
                        bucket_name = s3_path.split('://')[1].split('/')[0]
                        object_key = '/'.join(s3_path.split('://')[1].split('/')[1:])
                        
                        # Initialize S3Helper
                        s3_helper = S3Helper(bucket_name=bucket_name)
                        
                        # Download and parse the JSON results
                        download_result = s3_helper.download_file_obj(object_key)
                        if download_result['success']:
                            content = download_result['file_obj'].read().decode('utf-8')
                            analysis_content = json.loads(content)
                            
                            # Replace S3 path with actual content
                            result_data['analysis_result'] = analysis_content
                        else:
                            logger.error(f"Failed to download analysis results: {download_result['message']}")
                            
                    except Exception as e:
                        logger.error(f"Error fetching analysis results from S3: {str(e)}")
                        # Keep the S3 path in case of error
                
                return Response(result_data, status=status.HTTP_200_OK)
            
            else:
                # Get all BrowserExtensionAnalysis records for the user (without S3 content)
                data = BrowserExtensionAnalysis.objects.filter(user_id=user.id)
                serializer = BrowserExtensionAnalysisSerializer(data, many=True)
                
                if serializer.data:
                    return Response(serializer.data, status=status.HTTP_200_OK)
                return Response(
                    {'message': 'No BrowserExtensionAnalysis records found'},
                    status=status.HTTP_200_OK
                )
                
        except Exception as e:
            logger.error(f"Error in BrowserExtensionAnalysisAPIView GET: {str(e)}")
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        """
        POST method to create a new browser extension analysis.
        
        Required fields:
        - project: Project ID
        - extension_file: The browser extension file to analyze (.crx, .xpi, .safariextz, .zip)
        
        Optional fields:
        - extension_name: Name of the extension (auto-detected from manifest if not provided)
        """
        try:
            user = request.user
            
            # Validate required fields
            project_id = request.data.get('project')
            extension_file = request.FILES.get('extension_file')
            
            if not project_id:
                return Response(
                    {'message': 'project is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not extension_file:
                return Response(
                    {'message': 'extension_file is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate file extension
            file_name = extension_file.name.lower()
            valid_extensions = ('.crx', '.xpi', '.safariextz', '.zip')
            
            if not file_name.endswith(valid_extensions):
                return Response(
                    {'message': f'Invalid file type. Supported formats: {", ".join(valid_extensions)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Determine extension type from file extension
            extension_type_map = {
                '.crx': 'CRX',
                '.xpi': 'XPI',
                '.safariextz': 'SAFARIEXTZ',
                '.zip': 'ZIP'
            }
            
            file_ext = '.' + file_name.rsplit('.', 1)[-1]
            extension_type = extension_type_map.get(file_ext, 'ZIP')
            
            # Verify project belongs to user
            try:
                project = Project.objects.get(id=project_id, user_id=user.id)
            except Project.DoesNotExist:
                return Response(
                    {'message': 'Project not found or you do not have permission to access it'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get extension name from request or filename
            extension_name = request.data.get('extension_name', '')
            if not extension_name:
                extension_name = os.path.splitext(extension_file.name)[0]
            
            # Create BrowserExtensionAnalysis record
            extension_analysis = BrowserExtensionAnalysis.objects.create(
                user_id=user,
                project=project,
                extension_name=extension_name,
                extension_type=extension_type,
                extension_file=extension_file,
                file_size=extension_file.size,
                browser_extension_analysis_status='Uploading'
            )
            
            # Update status to Waiting before triggering task
            extension_analysis.browser_extension_analysis_status = 'Waiting'
            extension_analysis.save()
            
            # Trigger the analysis task
            BrowserExtensionAnalysisTask.delay(extension_analysis.id)
            
            # Return the created record
            serializer = BrowserExtensionAnalysisSerializer(extension_analysis)
            return Response(
                {
                    'message': 'Browser extension analysis initiated successfully',
                    'data': serializer.data
                },
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            logger.error(f"Error in BrowserExtensionAnalysisAPIView POST: {str(e)}")
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # def patch(self, request, scan_uuid):
    #     """
    #     PATCH method to update a browser extension analysis record.
    #     Only allows updating certain fields like extension_name.
    #     """
    #     try:
    #         user = request.user
            
    #         # Get the record ensuring user owns it
    #         try:
    #             extension_analysis = BrowserExtensionAnalysis.objects.get(scan_uuid=scan_uuid, user_id=user.id)
    #         except BrowserExtensionAnalysis.DoesNotExist:
    #             return Response(
    #                 {'message': 'Not found or not authorized to update this record.'},
    #                 status=status.HTTP_404_NOT_FOUND
    #             )
            
    #         # Only allow updating certain fields
    #         allowed_fields = ['extension_name']
    #         update_data = {k: v for k, v in request.data.items() if k in allowed_fields}
            
    #         serializer = BrowserExtensionAnalysisSerializer(
    #             extension_analysis,
    #             data=update_data,
    #             partial=True
    #         )
            
    #         if serializer.is_valid():
    #             serializer.save()
    #             return Response(serializer.data, status=status.HTTP_200_OK)
    #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    #     except Exception as e:
    #         logger.error(f"Error in BrowserExtensionAnalysisAPIView PATCH: {str(e)}")
    #         return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # def delete(self, request, scan_uuid):
    #     """
    #     DELETE method to remove a browser extension analysis record.
    #     Also removes the associated extension file.
    #     """
    #     try:
    #         user = request.user
            
    #         # Get the record ensuring user owns it
    #         try:
    #             extension_analysis = BrowserExtensionAnalysis.objects.get(scan_uuid=scan_uuid, user_id=user.id)
    #         except BrowserExtensionAnalysis.DoesNotExist:
    #             return Response(
    #                 {'message': 'Not found or not authorized to delete this record.'},
    #                 status=status.HTTP_404_NOT_FOUND
    #             )
            
    #         # Delete the associated file if it exists
    #         if extension_analysis.extension_file:
    #             try:
    #                 if os.path.exists(extension_analysis.extension_file.path):
    #                     os.remove(extension_analysis.extension_file.path)
    #             except Exception as file_error:
    #                 logger.warning(f"Failed to delete extension file: {str(file_error)}")
            
    #         # Delete the record
    #         extension_analysis.delete()
            
    #         return Response(
    #             {'message': 'BrowserExtensionAnalysis record deleted successfully'},
    #             status=status.HTTP_200_OK
    #         )
            
    #     except Exception as e:
    #         logger.error(f"Error in BrowserExtensionAnalysisAPIView DELETE: {str(e)}")
    #         return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SCAAnalysisAPIView(APIView):
    """
    Software Composition Analysis: scan a repo's dependency manifests for known
    CVEs (OSV/NVD) plus a light regex SAST pass. The source can be a GitHub repo
    (cloned) or an uploaded .zip of a local repo (extracted).

      GET  /api/sca-analysis/               list current user's SCA runs
      GET  /api/sca-analysis/<scan_uuid>/   run detail (full result JSON inline)
      POST /api/sca-analysis/               start a run:
             - GitHub: {project, source_url}
             - Upload: multipart {project, source_file=<repo.zip>}
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, scan_uuid=None):
        try:
            user = request.user
            if scan_uuid:
                data = SCAAnalysis.objects.filter(user_id=user.id, scan_uuid=scan_uuid)
                serializer = SCAAnalysisSerializer(data, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
            data = SCAAnalysis.objects.filter(user_id=user.id)
            serializer = SCAAnalysisSerializer(data, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            user = request.user
            project_id = request.data.get('project')
            source_url = (request.data.get('source_url') or '').strip()
            source_file = request.FILES.get('source_file')

            if not project_id:
                return Response({'message': 'Project ID is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Decide the source: an uploaded archive takes precedence over a URL.
            if source_file:
                if not source_file.name.lower().endswith('.zip'):
                    return Response({'message': 'Uploaded repo must be a .zip archive'},
                                    status=status.HTTP_400_BAD_REQUEST)
                source_type = SCAAnalysis.SCASourceType.Upload
            elif source_url:
                source_type = SCAAnalysis.SCASourceType.GitHub
            else:
                return Response(
                    {'message': 'Provide either source_url (GitHub repo URL) or source_file (a .zip of the repo)'},
                    status=status.HTTP_400_BAD_REQUEST)

            try:
                project = Project.objects.get(pk=project_id, user_id=user.id)
            except Project.DoesNotExist:
                return Response({'message': 'Project not found or you do not have permission to access it'},
                                status=status.HTTP_404_NOT_FOUND)

            sca = SCAAnalysis.objects.create(
                user_id=user, project=project,
                source_type=source_type,
                source_url=source_url or None,
                source_file=source_file if source_file else None,
                sca_analysis_status=SCAAnalysis.SCAAnalysisStatus.Waiting,
            )

            # Enqueue; fall back to eager execution if the broker is unreachable
            # (local dev without Redis), matching the recon app's behaviour.
            try:
                SCAScanTask.delay(sca.id)
            except Exception as broker_err:
                logger.warning(f"SCA broker unavailable ({broker_err}); running eagerly")
                try:
                    SCAScanTask.apply(args=(sca.id,))
                except Exception as run_err:
                    logger.exception("eager SCAScanTask failed")
                    sca.sca_analysis_status = 'Failed'
                    sca.error_message = f"failed to start: {run_err}"
                    sca.save(update_fields=['sca_analysis_status', 'error_message', 'updated_at'])

            sca.refresh_from_db()
            return Response(SCAAnalysisSerializer(sca).data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SASTTriageAPIView(APIView):
    """
    Persistent triage for taint SAST findings, keyed by the stable fingerprint so
    a decision survives every re-scan of the project.

      GET  /api/sast-triage/?project=<id>          list triage decisions for a project
      POST /api/sast-triage/                        set/clear a decision
            body: {project, fingerprint, status, note?, cwe?, sink?, title?, scan_uuid?}
            status in: open | false_positive | accepted_risk | wont_fix
            (status='open' clears the decision). If scan_uuid is given, the stored
            scan result is patched in place so the change shows without re-scanning.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        project_id = request.query_params.get('project')
        qs = SASTTriage.objects.filter(project__user_id=user.id)
        if project_id:
            qs = qs.filter(project_id=project_id)
        return Response(SASTTriageSerializer(qs, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            user = request.user
            project_id = request.data.get('project')
            fingerprint = (request.data.get('fingerprint') or '').strip()
            new_status = (request.data.get('status') or '').strip()
            note = request.data.get('note', '')

            valid = {c[0] for c in SASTTriage.Status.choices}
            if not project_id or not fingerprint:
                return Response({'message': 'project and fingerprint are required'},
                                status=status.HTTP_400_BAD_REQUEST)
            if new_status not in valid:
                return Response({'message': f'status must be one of {sorted(valid)}'},
                                status=status.HTTP_400_BAD_REQUEST)

            try:
                project = Project.objects.get(id=project_id, user_id=user.id)
            except Project.DoesNotExist:
                return Response({'message': 'Project not found or not yours'},
                                status=status.HTTP_404_NOT_FOUND)

            if new_status == 'open':
                # Clearing a decision removes the row (reverts finding to active).
                SASTTriage.objects.filter(project=project, fingerprint=fingerprint).delete()
                triage_obj = None
            else:
                triage_obj, _ = SASTTriage.objects.update_or_create(
                    project=project, fingerprint=fingerprint,
                    defaults={
                        'status': new_status,
                        'note': note,
                        'cwe': request.data.get('cwe', ''),
                        'sink': request.data.get('sink', ''),
                        'title': request.data.get('title', ''),
                        'triaged_by': user,
                    },
                )

            # Optionally patch the stored scan result so the UI reflects the change
            # immediately without a re-scan.
            scan_uuid = request.data.get('scan_uuid')
            if scan_uuid:
                self._repatch_scan(user, scan_uuid, project)

            return Response(
                SASTTriageSerializer(triage_obj).data if triage_obj else {'status': 'open', 'fingerprint': fingerprint},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def _repatch_scan(self, user, scan_uuid, project):
        """Recompute active/suppressed/summary on a stored StaticAnalysis result
        by re-applying current triage to its already-computed findings — no re-scan."""
        try:
            sa = StaticAnalysis.objects.filter(scan_uuid=scan_uuid, user_id=user.id).first()
            if not sa or not sa.Taint_analysis_result:
                return
            result = sa.Taint_analysis_result
            findings = result.get('taint_findings') or []
            triage = {
                t.fingerprint: {'status': t.status, 'note': t.note}
                for t in SASTTriage.objects.filter(project=project).exclude(status='open')
            }
            summary = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
            active = []
            for f in findings:
                decision = triage.get(f.get('fingerprint'))
                if decision:
                    f['triage_status'] = decision['status']
                    f['triage_note'] = decision.get('note', '')
                else:
                    f['triage_status'] = 'open'
                    f['triage_note'] = ''
                is_active = (not f.get('suppressed')) and f.get('triage_status', 'open') == 'open'
                if is_active:
                    active.append(f)
                    sev = (f.get('severity') or '').lower()
                    if sev in summary:
                        summary[sev] += 1
            result.update({
                'taint_findings': findings,
                'active': active,
                'summary': summary,
                'active_total': len(active),
                'suppressed_total': len(findings) - len(active),
                'cross_file': sum(1 for f in active if f.get('cross_file')),
            })
            sa.Taint_analysis_result = result
            sa.save(update_fields=['Taint_analysis_result', 'updated_at'])
        except Exception:
            logger.exception("SAST triage: failed to repatch scan result")
