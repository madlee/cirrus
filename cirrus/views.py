from madlee.misc.dj import json_response

from pandas import read_csv

@json_response
def header(request):
    df = read_csv('tests/data/yiwen.csv')
    count = df.count()
    unique = df.nunique()
    max    = df.max()
    min    = df.min()
    dtype  = df.dtypes
    
    header = [{
        'name': row,
        'max': max[row],
        'min': min[row],
        'count': int(count[row]),
        'unique': int(unique[row]),
        'type': str(dtype[row])
    } for row in df.columns ]
    return {
        'shape': df.shape,
        'header': header
    }

@json_response
def data(request):
    df = read_csv('tests/data/yiwen.csv')
    orders = request.GET.get('orders', None)
    if orders:
        orders = orders.split(',')
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
    
    columns = {row: [
        i for i in df[row]
    ] for row in df.columns }
    return {
        'data': columns,
        'orders': orders
    }

@json_response
def chart(request):
    pass

