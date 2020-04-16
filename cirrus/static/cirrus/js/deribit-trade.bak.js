axios.interceptors.request.use((config) => {
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    let regex = /.*csrftoken=([^;.]*).*$/; // 用于从cookie中匹配 csrftoken值
    config.headers['X-CSRFToken'] = document.cookie.match(regex) === null ? null : document.cookie.match(regex)[1];
    return config
});
  

Vue.component('account-list', {
    props: ['account_list'],
    template: `
    <ul role="menu" class="dropdown-menu">
        <li class="active"><a href=""><i class="fa fa-btc"></i> BTC A2-FItBw</a></li>
        <li><a href=""><i class="fa fa-euro"></i> ETH A2-FItBw</a></li>
        <li><a href=""><i class="fa fa-btc"></i> BTC Test-Account</a></li>
        <li><a href=""><i class="fa fa-euro"></i> ETH Test-Account</a></li>
    </ul>
    `
})

new Vue({
    el: '#account-list'
})

Vue.component('market-price', {
    props: ['currency', 'mid_price', 'open_interest'],
    template: `
        <div class="ibox float-e-margins">
            <div class="ibox-title">
            <span class="label label-success pull-right">Perpetual Mid Price</span>
                <h5>{{ currency }} Market</h5>
            </div>
            <div class="ibox-content">
                <h1 class="no-margins"><i class="fa fa-btc"></i> {{ mid_price|currency2 }}</h1>
                <div class="stat-percent font-bold text-success"><i class="fa fa-btc"></i> {{ open_interest|currency2 }}</div>
                <small>Open Interest</small>
            </div>
        </div>
    `
})

var market_price = new Vue({
    el: '#market-price',
    data() {
        return {
            mid_price: 0,
            currency: 'BTC',
            open_interest: 0
        }
    },
    methods: {
        update_price() {
            var price = this
            axios.get('/iblis/market_price.json').then(function(response){
                var data = response.data.data
                price.currency = data.currency
                price.mid_price = data.mid_price
                price.open_interest = data.open_interest
            })
        }
    },
    mounted() {
        this.timer = setInterval(this.update_price, 2000);
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },
})

Vue.component('account-balance', {
    props: ['currency', 'equity', 'available'],
    template: `
        <div class="ibox float-e-margins">
            <div class="ibox-title">
            <span class="label label-info pull-right">Account Balance </span>
                <h5>{{ currency }} Balance</h5>
            </div>
            <div class="ibox-content">
                <h1 class="no-margins"> <i class="fa fa-btc"></i> {{ equity|currency }} </h1>
                <div class="stat-percent font-bold text-info"> {{ available|currency }}</div>
                <small>Available</small>
            </div>
        </div>
    `
})


var market_price = new Vue({
    el: '#account-balance',
    data() {
        return {
            currency: 'BTC',
            equity: 0,
            available: 0
        }
    },
    methods: {
        update_price() {
            var price = this
            axios.get('/iblis/account_balance.json').then(function(response){
                var data = response.data.data
                price.currency = data.currency
                price.equity = data.equity
                price.available = data.available
            })
        }
    },
    mounted() {
        this.timer = setInterval(this.update_price, 2000);
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },
})

Vue.component('position', {
    props: ['kind', 'instrument', 'side', 'size', 'pnl', 'initial_margin', 
        'maintenance_margin', 'sigma', 'delta', 'gamma', 'theta', 'vega',
        'hedge'
    ],
    computed: {
        postionClass: function () {
            return {
                'text-danger': this.size < 0,
                'text-success': this.size > 0
            }
        },
        pnlClass: function() {
            return {
                'text-danger': this.pnl < 0,
                'text-success': this.pnl > 0
            }
        }
    },
    watch: {
        sigma: function (new_value, old_value) {
            axios.post('/iblis/update_sigma.act', 
                {instrument: this.instrument, sigma: this.sigma}
            )
        },
        hedge: function(new_value, old_value) {
            axios.post('/iblis/update_hedge.act', 
                {instrument: this.instrument, hedge: this.hedge}
            )
        }
    },
    template: `<tr v-bind:class="postionClass">
        <td><i class="fa fa-ge" v-if="kind==='option'"></i></td>
        <td>{{ instrument }}</td>
        <td>{{ side }}</td>
        <td class="align-right">{{ size|currency }}</td>
        <td class="align-right" v-bind:class="pnlClass">{{ pnl|currency }}</td>
        <td class="align-right">
            <input type="number" step="0.01" align="right" size="5" min="0" v-if="kind==='option'" v-model=sigma>
        </td>
        <td class="align-right">{{ delta|currency }}</td>
        <td class="align-right">{{ gamma|currency }}</td>
        <td class="align-right">{{ vega|currency }}</td>
        <td class="align-right">{{ theta|currency }}</td>
        <td class="align-right">{{ initial_margin|currency }}</td>
        <td class="align-right">{{ maintenance_margin|currency }}</td>
        <td><input type="radio" v-if="kind==='option'" value="P" v-model="hedge"></input></td>
        <td><input type="radio" v-if="kind==='option'" value="A" v-model="hedge"></input></td>
        <td><input type="radio" v-if="kind==='option'" value="M" v-model="hedge"></input></td>
    </tr>
    `
})

Vue.component('position-list', {
    data() {
        return {perpetual:{}, option_list: []}
    },
    computed: {
        total_size() {
            var result = this.perpetual.size
            for (var i = 0; i < this.option_list.length; ++i) {
                result += this.option_list[i].size
            }
            return result
        },
        total_delta() {
            var result = this.perpetual.size
            for (var i = 0; i < this.option_list.length; ++i) {
                if (this.option_list[i].size !== 0) {
                    result += this.option_list[i].delta
                }
            }
            return result
        },
        total_gamma() {
            var result = 0
            for (var i = 0; i < this.option_list.length; ++i) {
                if (this.option_list[i].size !== 0) {
                    result += this.option_list[i].gamma
                }
            }
            return result
        },
        total_theta() {
            var result = 0
            for (var i = 0; i < this.option_list.length; ++i) {
                if (this.option_list[i].size !== 0) {
                    result += this.option_list[i].theta
                }
            }
            return result
        },
        total_vega() {
            var result = 0
            for (var i = 0; i < this.option_list.length; ++i) {
                if (this.option_list[i].size !== 0) {
                    result += this.option_list[i].vega
                }
            }
            return result
        }
    },
    methods: {
        update_position_list() {
            var positions = this
            axios.get('/iblis/positions.json').then(function(response) {
                positions.option_list=response.data.data.options
                positions.perpetual=response.data.data.perpetual
            })
        }
    },
    mounted() {
        this.timer = setInterval(this.update_position_list, 2000);
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },
    template: `
    <tbody>
        <position
            v-bind:instrument="perpetual.instrument_name"
            v-bind:kind="perpetual.kind"
            v-bind:size="perpetual.size"
            v-bind:sigma="perpetual.sigma"
            v-bind:pnl="perpetual.total_profit_loss"
            v-bind:delta="perpetual.delta"
            v-bind:gamma="perpetual.gamma"
            v-bind:theta="perpetual.theta"
            v-bind:vega="perpetual.vega"
            v-bind:initial_margin='perpetual.initial_margin'
            v-bind:maintenance_margin='perpetual.maintenance_margin'
            v-bind:side="perpetual.direction"
        ></position>
        <position
            v-for="item in option_list"
            v-bind:key="item.instrument_name"
            v-bind:instrument="item.instrument_name"
            v-bind:kind="item.kind"
            v-bind:size="item.size"
            v-bind:sigma="item.sigma"
            v-bind:pnl="item.total_profit_loss"
            v-bind:delta="item.delta"
            v-bind:gamma="item.gamma"
            v-bind:theta="item.theta"
            v-bind:vega="item.vega"
            v-bind:initial_margin='item.initial_margin'
            v-bind:maintenance_margin='item.maintenance_margin'
            v-bind:side="item.direction"
            v-bind:hedge="item.hedge"
        ></position>
        
        <tr>
            <th></th>
            <th colspan="2">SUMMARY</th>
            <th style="text-align: right">{{ total_size|currency }}</th>
            <th></th>
            <th></th>
            <th class="align-right">{{ total_delta|currency }}</th>
            <th class="align-right">{{ total_gamma|currency }}</th>
            <th class="align-right">{{ total_vega|currency }}</th>
            <th class="align-right">{{ total_theta|currency }}</th>
            <th></th><th></th><th></th><th></th><th></th>
        </tr>
    </tbody>
    `
})


new Vue({ 
    el: '#position-list', 
    data() {
        return {
            perpetual: {},
            option_list: []
        }
    }
})


Vue.component('hedge-on-price', {
    data() {
        return {
            min_price: 7000,
            max_price: 9000,
            grid_size: 100,
            check_all: false,
            hedge_list: []
        }
    },
    methods: {
        refresh() {
            var self = this
            axios.get('/iblis/hedge_on_price.json',
                {params: {min_price: this.min_price, max_price: this.max_price, grid_size: this.grid_size}}
            ).then(
                function(response) {
                    self.hedge_list = response.data.data.hedge_list
                }
            )
            return false
        },
        place_orders() {

        }
    },
    watch: {
        check_all(old_value, new_value) {
            for(var i = 0; i <this.hedge_list.length; ++i) {
                this.hedge_list[i].checked = this.check_all;
            }
        }
    },
    template: `
    <div>
        <form role="form" class="form-inline">
            <div class="form-group col-md-3">
                <label class="sr-only">Minimal</label>
                <div class="input-group m-b">
                    <span class="input-group-addon">Min <i class="fa fa-usd"></i></span> 
                    <input type="number" class="form-control" v-model="min_price"> 
                </div>
            </div>
            <div class="form-group col-md-3">
                <label class="sr-only">Maximal</label>
                <div class="input-group m-b">
                    <span class="input-group-addon">Max <i class="fa fa-usd"></i></span> 
                    <input type="number" class="form-control" v-model="max_price"> 
                </div>
            </div>
            <div class="form-group col-md-3">
                <label class="sr-only">Grid Size</label>
                <div class="input-group m-b">
                    <span class="input-group-addon">Grid Size <i class="fa fa-usd"></i></span> 
                    <input type="number" class="form-control" v-model="grid_size"> 
                </div>
            </div>
            <div class="form-group col-md-3">
                <label class="sr-only"></label>
                <button type="button" class="btn btn-default pull-right" v-on:click="refresh">
                    <strong><i class="fa fa-refresh"></i> Refresh</strong>
                </button>
            </div>
        </form>
        <table class="table table-striped">
            <thead>
                <tr>
                    <th><td><input type="checkbox" v-model="check_all"></input></td></th>
                    <th class="text-right">Price (<i class="fa fa-usd"></i>)</th>
                    <th class="text-right">Detla (<i class="fa fa-btc"></i>)</th>
                    <th class="text-right">Direction</th>
                    <th class="text-right">Amount (<i class="fa fa-usd"></i>)</th>
                    <th class="text-right">Summary (<i class="fa fa-usd"></i>)</th>
                </tr>
            </thead>
            <tbody>
                <tr v-bind:class="row.direction" v-for="row in hedge_list">
                    <td><input type="checkbox" v-model="row.checked"></input></td>
                    <td class="text-right">{{ row.price }}</td>
                    <td class="text-right">{{ row.delta|currency }}</td>
                    <td class="text-right">{{ row.direction }}</td>
                    <td class="text-right">{{ row.amount }}</td>
                    <td class="text-right">{{ row.summary }}</td>
                </tr>
            </tbody>
        </table>
        <form role="form" class="form-inline">
            <div class="form-group col-md-12">
                <label class="sr-only"></label>
                <button type="button" class="btn btn-primary pull-right" v-on:click="place_orders">
                    <strong><i class="fa fa-refresh"></i> Place Selected Order</strong>
                </button>
            </div>
        </form>
    </div>
    `
})


new Vue({ 
    el: '#frm-hedge-on-price'
})


Vue.component('auto-hedge', {
    data() {
        return {
            is_running: false,
            min_price: 5000,
            max_price: 5000,
            threshold: 50,
            time_gap:  60
        }

    },
    methods: {
        toggle_hedge() {

        }
    },
    template: `
    <div>
        <form role="form" class="form-horizontal">
            <div class="form-group">
                <div class="text-right col-sm-12">
                    <input type="checkbox" class="js-switch form-control" v-model="is_running"/>
                </div>
            </div>
            <div class="hr-line-dashed"></div>
            <div class="form-group">
                <div class="col-md-3">
                    <label class="sr-only">Minimal</label>
                    <div class="input-group m-b">
                        <span class="input-group-addon">Min <i class="fa fa-usd"></i></span> 
                        <input type="number" class="form-control" v-model="min_price"> 
                    </div>
                </div>
                <div class="col-md-3">
                    <label class="sr-only">Maximal</label>
                    <div class="input-group m-b">
                        <span class="input-group-addon">Max <i class="fa fa-usd"></i></span> 
                        <input type="number" class="form-control" v-model="max_price"> 
                    </div>
                </div>
                <div class="col-md-3">
                    <label class="sr-only">Threshold</label>
                    <div class="input-group m-b">
                        <span class="input-group-addon">Threshold <i class="fa fa-usd"></i></span> 
                        <input type="number" class="form-control" v-model="threshold"> 
                    </div>
                </div>
                <div class="col-md-3">
                    <label class="sr-only">Time Gap</label>
                    <div class="input-group m-b">
                        <span class="input-group-addon">Time Gap <i class="fa fa-clock-o"></i></span> 
                        <input type="number" class="form-control" v-model="time_gap"> 
                    </div>
                </div>
            </div>
        </form>
    </div>
    `
})


new Vue({ 
    el: '#frm-auto-hedge'
})

Vue.component('market-item', {
    props: ['price', 'time', 'ticks'],
    computed: {
        call_price() {
            var item = this.ticks["BTC-"+this.time+"-"+this.price+"-C"]
            if (typeof(item) === 'undefined') {
                return null;
            }
            else {
                return (item.ask0_price+item.bid0_price)/2
            }
        },
	delta() {
	    var item = this.ticks["BTC-"+this.time+"-"+this.price+"-C"]
	    if (typeof(item) === 'undefined') {
                return null;
            }
            else {
                return item.ask0_price-item.bid0_price
            }
	},
        call_title() {
            var item = this.ticks["BTC-"+this.time+"-"+this.price+"-C"]
            if (typeof(item) === 'undefined') {
                return null;
            }
            else {
                return [
                    this.time + '-' + this.price + '-C',
                    'Last:  ' + item.last_price,
                    'Open:  ' + item.open_interest,
                    'Bid0:  ' + item.bid0_price.toFixed(4)+" ("+item.bid0_iv.toFixed(2)+"%)",
                    'Mark:  ' + item.mark_price.toFixed(4)+" ("+item.mark_iv.toFixed(2)+"%)",
                    'Ask0:  ' + item.ask0_price.toFixed(4)+" ("+item.ask0_iv.toFixed(2)+"%)",
                    'Delta: ' + item.delta.toFixed(4),
                    'Gamma: ' + item.gamma.toFixed(4),
                    'Theta: ' + item.theta.toFixed(4),
                    'Vega:  ' + item.vega.toFixed(4)

                ].join("\n")
            }
        },
        put_price() {
            var item = this.ticks["BTC-"+this.time+"-"+this.price+"-P"]
            if (typeof(item) === 'undefined') {
                return null;
            }
            else {
                return (item.ask0_price+item.bid0_price)/2
            }
        },
        put_title() {
            var item = this.ticks["BTC-"+this.time+"-"+this.price+"-P"]
            if (typeof(item) === 'undefined') {
                return null;
            }
            else {
                return [
                    this.time + '-' + this.price + '-P',
                    'Last:  ' + item.last_price,
                    'Open:  ' + item.open_interest,
                    'Ask0:  ' + item.ask0_price.toFixed(4)+" ("+item.ask0_iv.toFixed(2)+"%)",
                    'Mark:  ' + item.mark_price.toFixed(4)+" ("+item.mark_iv.toFixed(2)+"%)",
                    'Bid0:  ' + item.bid0_price.toFixed(4)+" ("+item.bid0_iv.toFixed(2)+"%)",
                    'Delta: ' + item.delta.toFixed(4),
                    'Gamma: ' + item.gamma.toFixed(4),
                    'Theta: ' + item.theta.toFixed(4),
                    'Vega:  ' + item.vega.toFixed(4)

                ].join("\n")
            }
        }
    },
    template: `
    <td>
        <a role="button" v-bind:title="call_title">
            <strong>C: </strong>{{ call_price|currency }} <small>{{ delta|currency }}</small>
        </a>
        <a role="button" class="pull-right" v-bind:title="put_title">
            <strong>P: </strong>{{ put_price|currency }}  <small>{{ delta|currency }}</small>
        </a>
    </td>
    `
})

Vue.component('current-market', {
    data() {
	    return {'market': null}
    },
    methods: {
        update_current_market() {
            var market = this
            axios.get('/iblis/current_market.json').then(function(response) {
                market.market = response.data.data
            })
        },
        is_lower(price) {
            var mid_price = (this.market.perpetual.ask0_price+this.market.perpetual.bid0_price)/2
            return price < mid_price;
        }
    },
    mounted() {
        this.timer = setInterval(this.update_current_market, 2000);
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },
    template: `
    <table class="table table-bordered">
        <thead>
        <tr>
            <th>Price</th>
            <th class="text-center" v-for="time in market.times">{{time}}</th>
        </tr>
        </thead>
        <tbody>
            <tr v-for="price in market.prices" v-bind:class="{'bg-lower-price': is_lower(price)}">
                <th>{{price}}</th>
                <market-item v-for="time in market.times" v-bind:price="price" v-bind:time="time" v-bind:ticks="market.ticks"></market-item>
            </tr>
        </tbody>
    </table>
    `
})
new Vue({
    el: '#current-market'
})

