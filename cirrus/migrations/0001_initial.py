# Generated by Django 2.2 on 2020-04-06 08:54

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import madlee.fields
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('madlee', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CirrusChart',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('uuid', models.UUIDField(default=uuid.uuid4, unique=True)),
                ('name', models.CharField(max_length=200)),
                ('config', madlee.fields.JSONField(default=dict)),
                ('author', models.ForeignKey(blank=True, default=None, null=True, on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL)),
                ('tags', models.ManyToManyField(blank=True, to='madlee.Tag')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='CirrusData',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('uuid', models.UUIDField(default=uuid.uuid4, unique=True)),
                ('name', models.CharField(max_length=200)),
                ('source', models.TextField(blank=True, default='')),
                ('config', madlee.fields.JSONField(default=dict)),
                ('author', models.ForeignKey(blank=True, default=None, null=True, on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL)),
                ('charts', models.ManyToManyField(blank=True, to='cirrus.CirrusChart')),
                ('tags', models.ManyToManyField(blank=True, to='madlee.Tag')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
