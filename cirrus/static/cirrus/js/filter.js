Vue.filter('currency', function(val) {
    if (typeof(val) !== 'undefined' && val !== null) {
        return val.toFixed(4)
    }
    else {
        return val
    }
})

Vue.filter('currency2', function(val) {
    if (typeof(val) !== 'undefined' && val !== null) {
        return val.toFixed(2)
    }
    else {
        return val
    }
})
