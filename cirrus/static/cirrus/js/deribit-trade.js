axios.interceptors.request.use((config) => {
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    let regex = /.*csrftoken=([^;.]*).*$/; // 用于从cookie中匹配 csrftoken值
    config.headers['X-CSRFToken'] = document.cookie.match(regex) === null ? null : document.cookie.match(regex)[1];
    return config
});



var position_row = {
    props: ['position'],
    computed: {
        postionClass: function () {
            return {
                'text-danger': this.position.size < 0,
                'text-success': this.position.size > 0
            }
        }
    },
    methods: {
        pnl_class: function (val) {
            if (typeof (val) === 'undefined') {
                return ''
            }
            else if (val < 0) {
                return "pnl_loss"
            }
            else if (val > 0) {
                return "pnl_profit"
            }
            else {
                return "pnl_zero"
            }
        }
    },
    filters: {
        token: function (value) {
            if (typeof (value) === 'undefined') {
                return ''
            }
            else {
                return value.toFixed(4)
            }
        }
    },
    template: `<tr>
        <th><i class="fab fa-battle-net" v-if="position.kind==='option'"></i></th>
        <th class="align-right">{{ position.instrument_name }}</th>
        <td class="align-right">{{ position.side }}</td>
        <td class="align-right" :class="pnl_class(position.size)">{{ position.size }}</td>
        <td class="align-right" :class="pnl_class(position.total_profit_loss)">{{ position.total_profit_loss|token }}</td>
        <td class="align-right">
            <input type="number" step="0.01" align="right" size="5" min="0" 
                v-if="position.kind==='option'" 
                :value="position.sigma"
                @change="$emit('sigma_changed', position, $event.target.value)"
            >
        </td>
        <td class="align-right" :class="pnl_class(position.delta)">{{ position.delta|token }}</td>
        <td class="align-right" :class="pnl_class(position.gamma)">{{ position.gamma|token }}</td>
        <td class="align-right" :class="pnl_class(position.vega)">{{ position.vega |token }}</td>
        <td class="align-right" :class="pnl_class(position.theta)">{{ position.theta|token }}</td>
        <td class="align-right">{{ position.initial_margin|token }}</td>
        <td class="align-right">{{ position.maintenance_margin|token }}</td>
        <td>
            <input type="radio" 
                v-if="position.kind==='option'" value="D" :checked="position.hedge==='D'"
                @change="$emit('hedge_changed', position, 'D')"
            >
            </input>
        </td>
        <td>
        <input type="radio" 
        v-if="position.kind==='option'" value="M" :checked="position.hedge==='M'"
        @change="$emit('hedge_changed', position, 'M')"
    >
    </input>
        </td>
    </tr>
    `
}

var app = new Vue({
    el: '#main',
    delimiters: ["{[", "]}"],
    data: {
        account_list: [],
        current_account: { id: '', currency: 'BTC' },
        market: { mid_price: 0, open_interest: 0 },
        timer: null,
        balance: { equity: 0, available: 0 },
        futures: [],
        options: [],
        ddh_on: false,
        ddh_keep: 0,
        ddh_gap: 0.01,
        ddh_by_market_order: true,
        show_loading: false
    },
    components: {
        'position-row': position_row
    },
    methods: {
        load_account(account) {
            clearInterval(this.timer);
            self.show_loading = true
            this.current_account = account
            this.update_all()
            this.timer = setInterval(this.update_all, 2000);
            return false
        },
        is_current_account(account_id) {
            return account_id === this.current_account.id
        },
        token_symbol(account) {
            if (account.currency === 'BTC') {
                return "fab fa-btc"
            }
            else if (account.currency === 'ETH') {
                return "fab fa-ethereum"
            }
            else {
                return "fab fa-" + account.currency.toLowerCase()
            }
        },
        update_all() {
            var self = this
            var account = this.current_account.currency + ':' + this.current_account.account
            axios.get('/iblis/account_message.json?account=' + account).then(function (response) {
                self.market = response.data.data.market
                self.balance = response.data.data.balance
                self.options = response.data.data.options
                self.futures = response.data.data.futures
                self.ddh_on  = response.data.data.ddh_on
                self.show_loading = false
            })
        },
        modify_sigma(position, value) {
            if (position.sigma !== value) {
                position.sigma = value
                axios.post('/iblis/update_sigma.act', {
                    account: this.current_account.id, 
                    instrument: position.instrument_name, sigma: value
                })
            }
        },
        modify_hedge(position, value) {
            if (position.hedge !== value) {
                position.hedge = value
                axios.post('/iblis/update_hedge.act', {
                    account: this.current_account.id, 
                    instrument: position.instrument_name, hedge: value
                })
            }
        },
        start_ddh() {
            if (!this.ddh_on) {
                $('#dlg-start-ddh').modal('hide')
                this.ddh_on = true;
            }
        },
        stop_ddh() {
            if (this.ddh_on) {
                this.ddh_on = false;
                axios.post('/iblis/stop_ddh.act')
            }
        },
        get_current_ddh_keep() {
            var rows = this.ddh_options
            var result = 0;
            for (var i = 0; i < rows.length; ++i) {
                result += rows[i].delta
            }
            this.ddh_keep = (-result).toFixed(4)
            return this.ddh_keep 
        }
    },
    computed: {
        current_token() {
            return this.token_symbol(this.current_account)
        },
        pnl_class() {
            if (this.balance.total_pl < 0) {
                return "pnl_loss"
            }
            else if (this.balance.total_pl > 0) {
                return "pnl_profit"
            }
            else {
                return "pnl_zero"
            }
        },
        total_size() {
            var result = 0;
            for (var i = 0; i < this.futures.length; ++i) {
                if (this.futures[i].size !== 0) {
                    result += this.futures[i].delta
                }
            }
            for (var i = 0; i < this.options.length; ++i) {
                result += this.options[i].size
            }
            return result
        },
        total_pnl() {
            var result = 0;
            for (var i = 0; i < this.futures.length; ++i) {
                if (this.futures[i].size !== 0) {
                    result += this.futures[i].total_profit_loss
                }
            }
            for (var i = 0; i < this.options.length; ++i) {
                if (this.options[i].size !== 0) {
                    result += this.options[i].total_profit_loss
                }
            }
            return result
        },
        total_delta() {
            var result = 0;
            for (var i = 0; i < this.futures.length; ++i) {
                if (this.futures[i].size !== 0) {
                    result += this.futures[i].delta
                }
            }
            for (var i = 0; i < this.options.length; ++i) {
                if (this.options[i].size !== 0) {
                    result += this.options[i].delta
                }
            }
            return result
        },
        total_gamma() {
            var result = 0
            for (var i = 0; i < this.options.length; ++i) {
                if (this.options[i].size !== 0) {
                    result += this.options[i].gamma
                }
            }
            return result
        },
        total_theta() {
            var result = 0
            for (var i = 0; i < this.options.length; ++i) {
                if (this.options[i].size !== 0) {
                    result += this.options[i].theta
                }
            }
            return result
        },
        total_vega() {
            var result = 0
            for (var i = 0; i < this.options.length; ++i) {
                if (this.options[i].size !== 0) {
                    result += this.options[i].vega
                }
            }
            return result
        },
        total_im() {
            var result = 0;
            for (var i = 0; i < this.futures.length; ++i) {
                if (this.futures[i].size !== 0) {
                    result += this.futures[i].initial_margin
                }
            }
            for (var i = 0; i < this.options.length; ++i) {
                result += this.options[i].initial_margin
            }
            return result;
        },
        total_mm() {
            var result = 0;
            for (var i = 0; i < this.futures.length; ++i) {
                if (this.futures[i].size !== 0) {
                    result += this.futures[i].maintenance_margin
                }
            }
            for (var i = 0; i < this.options.length; ++i) {
                result += this.options[i].maintenance_margin
            }
            return result;
        },
        ddh_options() {
            var result = []
            for (var i = 0; i < this.options.length; ++i) {
                if (this.options[i].hedge === 'D') {
                    result.push(this.options[i])
                }
            }
            return result
        },
    },
    filters: {
        price(value) {
            if (typeof (value) === 'undefined') {
                return ''
            }
            if (value > 0) {
                return value.toFixed(2)
            }
            else {
                return ''
            }
        },
        token(value) {
            if (typeof (value) === 'undefined') {
                return ''
            }
            if (value != 0) {
                return value.toFixed(4)
            }
            else {
                return ''
            }
        },
        percentage(value) {
            if (typeof (value) === 'undefined') {
                return ''
            }
            if (value > 0) {
                return (value * 100).toFixed(2) + '%'
            }
            else {
                return ''
            }
        }
    },
    mounted() {
        var self = this
        $('#dlg-start-ddh').on('show.bs.modal', this.get_current_ddh_keep)
        axios.get('account-list.json').then(function (response) {
            self.account_list = response.data.data.accounts
            if (self.account_list.length > 0) {
                self.load_account(self.account_list[0])
            }
        })
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },

})
