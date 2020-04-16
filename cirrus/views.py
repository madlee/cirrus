from math import isfinite
from uuid import uuid4
from json import loads as load_json, dumps as dump_json
from pandas import read_csv
from django.views.decorators.csrf import csrf_exempt
from django_redis import get_redis_connection

from madlee.misc.dj import json_response, json_request, render
from madlee.views import list_file
from .const import *

def index(request):
    return render(request, 'cirrus/chart.html')

@json_response
def profile(request):
    user = request.user
    if user.is_anonymous:
        return {
            'user': {
                'username': 'noone',
                'name': 'NO ONE',
                'is_anonymous': True
            },
            'config': {
                'page_size': 50,
                'chart_ratio': 50
            }
        }
    else:
        return {
            'user': {
                'username': user.username,
                'name': user.get_full_name(),
                'is_anonymous': False
            },
            'config': {
                'page_size': 50,
                'chart_ratio': 50
            }
        }
        

def _get_data(uuid):
    return read_csv('tests/data/yiwen.csv')


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
        df = _get_data(uuid)
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
            'type': str(dtype[row]),
            'format': '',
            'limits': ['', '']
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
    redis = get_redis_connection('cirrus')

    data_id = request.GET.get('uuid', '')
    df = _get_data(data_id)

    key = KEY_DIGEST_PREFIX + data_id
    header = load_json(redis.hget(key, 'header'))

    new_limits = request.GET.get('new_limits', None)
    if new_limits:
        name, limits_lower, limits_upper = new_limits.split('|')
    else:
        name = None
    for row in header:
        if row['name'] == name:
            row['limits'] = [limits_lower, limits_upper]
            redis.hset(key, 'header', dump_json(header))
            
        if row['limits'][0] != '':
            if row['type'].startswith('float'):
                lim = float(row['limits'][0])
            elif row['type'].startswith('int'):
                lim = int(row['limits'][0])
            df = df[df[row['name']] >= lim]
        elif row['limits'][1] != '':
            if row['type'].startswith('float'):
                lim = float(row['limits'][1])
            elif row['type'].startswith('int'):
                lim = int(row['limits'][1])
            df = df[df[row['name']] <= lim]
    
    print (df)
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




def _cumsum(y):
    return y.cumsum()

def _cumavg(y):
    n = y.notna()
    return y.cumsum()/n.cumsum()

def _cumcount(y):
    n = y.notna()
    return n.cumsum()

def _cummax(y):
    return y.cummax()

def _cummin(y):
    return y.cummin()


cumfunc = {
    'cumsum': _cumsum,
    'cumavg': _cumavg,
    'count':  _cumcount,
    'cummax': _cummax,
    'cummin': _cummin,
}



@json_response
def chart(request):
    redis = get_redis_connection('cirrus')
    # key = KEY_CHART_PREFIX + uuid

    data_id = request.GET.get('data_id', '')   
    x_axis = request.GET.get('x_axis', '')
    sort_on_x = request.GET.get('sort_on_x', True)
    y_axis = request.GET.get('y_axis', '')
    if y_axis:
        y_axis = [row.split(':') for row in y_axis.split('|')]
    else:
        # TODO:
        pass

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

    df = _get_data(data_id)
    key = KEY_DIGEST_PREFIX + data_id
    header = load_json(redis.hget(key, 'header'))

    for row in header:
        if row['limits'][0] != '':
            if row['type'].startswith('float'):
                lim = float(row['limits'][0])
            elif row['type'].startswith('int'):
                lim = int(row['limits'][0])
            df = df[df[row['name']] >= lim]
        elif row['limits'][1] != '':
            if row['type'].startswith('float'):
                lim = float(row['limits'][1])
            elif row['type'].startswith('int'):
                lim = int(row['limits'][1])
            df = df[df[row['name']] <= lim]
            
    if sort_on_x:
        df.sort_values(x_axis, inplace=True)
    series = []
    legend = [] 
    x = df[x_axis]
    for func, field in y_axis:
        y = df[field]
        if func:
            y = cumfunc[func](y)
            name = '%s(%s)' % (func, field)
        else:
            name = field

        legend.append(name)

        data = [(a, b) for a, b in zip(x, y) if isfinite(a) and isfinite(b)]
        series.append({
            'data': data,
            'type': 'line',
            'showSymbol': False,
            'name': name
        })

    option['series'] = series
    option['legend'] = {
        'data': legend
    }
    option['xAxis']['name'] = x_axis

    return option

