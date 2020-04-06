from uuid import uuid4
from django.db import models
from django.contrib.auth.models import User

from madlee.models import TimedModel, Tag, natural_model
from madlee.fields import JSONField


@natural_model
class CirrusChart(TimedModel):
    NATURAL_KEY_FILTER = 'uuid',

    uuid   = models.UUIDField(unique=True, default=uuid4)
    author = models.ForeignKey(User, null=True, blank=True, default=None, on_delete=models.PROTECT)
    name   = models.CharField(max_length=200)
    config = JSONField()
    tags   = models.ManyToManyField(Tag, blank=True)

    def natural_key(self):
        return (self.uuid, )

    def __str__(self):
        return self.name




@natural_model
class CirrusData(TimedModel):
    NATURAL_KEY_FILTER = 'uuid',

    uuid   = models.UUIDField(unique=True, default=uuid4)
    author = models.ForeignKey(User, null=True, blank=True, default=None, on_delete=models.PROTECT)
    name   = models.CharField(max_length=200)
    source = models.TextField(blank=True, default='')
    config = JSONField()
    tags   = models.ManyToManyField(Tag, blank=True)
    charts = models.ManyToManyField(CirrusChart, blank=True)

    def natural_key(self):
        return (self.uuid, )

    def __str__(self):
        return self.name

