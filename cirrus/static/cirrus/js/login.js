

Vue.component('frm-login',  {
    data() {
        return {username: '', password: '', otp_code: '', message:'Login in. To see it in action.'}
    }, 
    methods: {
        login() {
            var self = this
            axios.post('/iblis/login.act', {
                username: this.username, 
                password: this.password, 
                otp_code: this.otp_code
            }).then(function(response) {
                window.location = 'deribit-trade.html'
            }).catch(function(error) {
                self.message = error.response.data.message
            })
        }
    },
    template: `
    <form class="m-t" role="form" action="index.html">
        <p>{{ message }}</p>
        <div class="form-group">
            <input type="email" class="form-control" placeholder="Username" required="" v-model="username">
        </div>
        <div class="form-group">
            <input type="password" class="form-control" placeholder="Password" required="" v-model="password">
        </div>
        <div class="form-group">
            <input type="number" class="form-control" placeholder="Google Code" required="" v-model="otp_code">
        </div>
        <button type="button" class="btn btn-primary block full-width m-b" v-on:click=login>Login</button>

        <a href="404.html" disabled><small>Forgot password?</small></a>
        <p class="text-muted text-center"><small>Do not have an account?</small></p>
        <a class="btn btn-sm btn-white btn-block" href="register.html" >Create an account</a>
    </form>
    `
})


new Vue({ 
    el: '#frm-login', 
    data() {
        return { }
    }
})
