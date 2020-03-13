from math import isfinite
from uuid import uuid4
from json import loads as load_json, dumps as dump_json
from pandas import read_csv
from django.views.decorators.csrf import csrf_exempt
from django_redis import get_redis_connection

from madlee.misc.dj import json_response, json_request
from .const import *




@json_response
def header(request):
    uuid = request.GET.get('uuid', None)
    if uuid == None:
        uuid = str(uuid4())
    redis = get_redis_connection('cirrus')
    key = KEY_DIGEST_PREFIX + uuid
    result = redis.hgetall(key)
    if result:
        result = {k.decode(): load_json(v) for k, v in result.items()}
    else:
        df = read_csv('tests/data/yiwen.csv')
        count = df.count()
        unique = df.nunique()
        max    = df.max()
        min    = df.min()
        dtype  = df.dtypes
        
        header = [{
            'name': row,
            # 'max': max[row] ,
            # 'min': min[row] ,
            'count': int(count[row]),
            'unique': int(unique[row]),
            'type': str(dtype[row])
        } for row in df.columns ]
    
        result = {
            'shape': df.shape,
            'header': header,
            'title': 'data/yiwen.csv',
            'order': [],
        }
        redis.hmset(key, {k: dump_json(v) for k, v in result.items()})
    result['uuid'] = uuid
    return result




@csrf_exempt
@json_request
@json_response
def set_format(request, uuid, name, val, **kwargs):
    redis = get_redis_connection('cirrus')
    key = KEY_DIGEST_PREFIX + uuid
    result = load_json(redis.hget(key, 'header'))
    for row in result:
        if row['name'] == name:
            old_value = row['format']
            row['format'] = val
            break
    redis.hset(key, 'header', dump_json(result))

    return {
        'uuid': uuid, 'name': name, 'val': val, 'old': old_value
    }
 



@json_response
def data(request):
    df = read_csv('tests/data/yiwen.csv')
    orders = request.GET.get('order', '')
    orders = [row for row in orders.split(',') if row]
    if orders:
        sort_func = request.GET.get('sort', 'quicksort')
        ascending = [
            row[0] != '-'
            for row in orders
        ]
        by = [
            row[1:] if row[0] == '-' else row
            for row in orders
        ]
        df.sort_values(by=by, ascending=ascending, inplace=True, kind=sort_func)
    
    columns = {}
    for row in df.columns:
        if str(df[row].dtype).startswith('float'):
            columns[row] = [(i if isfinite(i) else None) for i in df[row]]
        else:
            columns[row] = [i for i in df[row]]
    
    return {
        'index': [row for row in df.index],
        'data': columns,
        'order': orders
    }




@json_response
def chart(request):
    uuid = request.GET.get('uuid', None)
    if uuid == None:
        uuid = str(uuid4())
    # redis = get_redis_connection('cirrus')
    # key = KEY_CHART_PREFIX + uuid

    option = {
    'animation': False,
    'grid': {
        'top': 40,
        'left': 50,
        'right': 40,
        'bottom': 50
    },
    'xAxis': {
        'name': 'x',
        'minorTick': {
            'show': True
        },
        'splitLine': {
            'lineStyle': {
                'color': '#999'
            }
        },
        'minorSplitLine': {
            'show': True,
            'lineStyle': {
                'color': '#ddd'
            }
        }
    },
    'yAxis': {
        'name': 'y',
        'minorTick': {
            'show': True
        },
        'splitLine': {
            'lineStyle': {
                'color': '#999'
            }
        },
        'minorSplitLine': {
            'show': True,
            'lineStyle': {
                'color': '#ddd'
            }
        }
    },
    'dataZoom': [{
        'show': True,
        'type': 'inside',
        'filterMode': 'none',
        'xAxisIndex': [0],
        'startValue': 100,
        'endValue': 500
    }, {
        'show': True,
        'type': 'inside',
        'filterMode': 'none',
        'yAxisIndex': [0],
        'startValue': -20,
        'endValue': 20
    }]
}

    x_axis = 'R2500'

    df = read_csv('tests/data/yiwen.csv')
    df.sort_values(x_axis, inplace=True)
    series = []
    legend = ['rtn1', 'rtn3', 'rtn5', 'rtn10', 'rtn20']
    x = df[x_axis]
    for row in legend:
        y = df[row]
        y = y.cumsum()
        n = y.notna().cumsum()
        data = [(a, b/c) for a, b, c in zip(x, y, n) if isfinite(a) and isfinite(b)]
        series.append({
            'data': data,
            'type': 'line',
            'showSymbol': False,
            'name': row
        })

    option['series'] = series
    option['legend'] = {
        'data': legend
    }

    return option