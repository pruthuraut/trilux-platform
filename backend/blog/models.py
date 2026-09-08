from django.db import models

# Create your models here.
class Blog(models.Model):
    category_choices = (
        ('llm','LLM'),
        ('cryptography','Cryptography'),
        ('security','Security'),
        ('vulnerability','Vulnerability'),
        ('exploit','Exploit'),
        ('threat','Threat'),
        ('attack','Attack'),
        ('malware','Malware'),
        ('network','Network'),
        ('web','Web'),
        ('mobile','Mobile'),
        ('iot','IoT'),
        ('cloud','Cloud'),
        ('forensics','Forensics'),
        ('cybercrime','Cybercrime'),
        ('cyberlaw','Cyberlaw'),
        ('cybersecurity','Cybersecurity'),
        ('others','Others'),
    )
    title=models.CharField(max_length=100)
    content=models.TextField()
    date_posted=models.DateTimeField(auto_now_add=True)
    author=models.CharField(max_length=50)
    image=models.ImageField(upload_to='post_images',default='default.jpg')
    category=models.CharField(max_length=20,choices=category_choices,default='others')
    tags=models.CharField(max_length=100)
    status=models.CharField(max_length=20,default='draft')
    views=models.IntegerField(default=0)
    likes=models.IntegerField(default=0)
    dislikes=models.IntegerField(default=0)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
class Comment(models.Model):
    comment_id=models.AutoField(primary_key=True)
    blog_id=models.ForeignKey(Blog,on_delete=models.CASCADE)
    comment=models.TextField()
    user_id=models.CharField(max_length=50)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.comment