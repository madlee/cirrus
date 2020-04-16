axios.interceptors.request.use((config) => {
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    let regex = /.*csrftoken=([^;.]*).*$/; // 用于从cookie中匹配 csrftoken值
    config.headers['X-CSRFToken'] = document.cookie.match(regex) === null ? null : document.cookie.match(regex)[1];
    return config
});

var Config = {
  debug: true,
  state: {
    page_size:   50,
    chart_scale: 60
  }
}

var Data = {
  state: {
    name: '',
    source: '',
    uuid: '',
    columns: []
  }
}

const DataTable = {
  data: {
    config: Config.state
  }

}

const Chart = {
  data: {
    config: Config.state,
  },
}


var vm = new Vue({
    el: '#cirrus-app',
    delimiters: ["{[", "]}"],
    data: {
      data_id: 'fb1afb3e-8966-4b31-a2e0-2e03fca70fda',
      chart_id: '16f3e536-65a9-4564-80b2-6c04cd38ffd8',
      title: 'Cirrus, floating with NO mind.',
      shape: [0, 0],
      header: [],
      order: [],
      data: {},
      index: [],
      chart: null,
      x_axis: 'LOG2500',
      sort_on_x: true,
      y_axis: [['cumavg', 'rtn1'], ['cumavg', 'rtn3'], ['cumavg', 'rtn5'], ['cumavg', 'rtn10'], ['cumavg', 'rtn20'], ],
      page: 1,
      page_set: [],
      page_size: 100,
      current_page: []
    },
    filters: {
      cell: function(value, template, type) {
        if (value === null) {
          return ''
        }
        if (type.startsWith('float') || type.startsWith('int')) {
          if (template === null) {
            if (type.startsWith('float')) {
              value = value.toFixed(4)
            }
          }
          else if (template.endsWith('%')) {
            value = value * 100
            value = value.toFixed(2)
            if (template.endsWith('%')) {
              value = value + '%'
            }
          }
          else if (template.startsWith('$')) {
            value = '$' + value.toFixed(2)
          }
          else if (type.startsWith('float')) {
            value = value.toFixed(4)
          }
        }
        return value
      }
    },
    computed: {
      numerical_columns() {
        var result = []
        for (var i = 0; i < this.header.length; ++i) {
          var head_i = this.header[i]
          if (head_i.type.startsWith('float') || head_i.type.startsWith('int')) {
            result.push(head_i.name)
          }
        }
        return result
      }
    },
    methods: {
      load_data(new_limits) {
        var self=this
        var parm =  {
          uuid: self.data_id, 
          order: self.order.join(',')
        }
        if (typeof(new_limits) !== 'undefined') {
          parm.new_limits=new_limits.join('|')
        }
        axios
          .get('data.json', {params: parm})
          .then(function(response) {
            var data = response.data['data']
            self.order = data.order
            self.data  = data.data
            self.index = data.index
            self.set_page(self.page)
          })
          .catch(function (error) { // 请求失败处理
            console.log(error);
          });
      },
      update_chart() {
        var self=this
        var y_axis = []
        for (var i = 0; i < self.y_axis.length; ++i) {
          y_axis.push(self.y_axis[i].join(':'))
        }
        var parm =  {
          chart_id: self.chart_id, 
          data_id: self.data_id,
          x_axis: self.x_axis,
          y_axis: y_axis.join('|')
        }
        if (this.sort_on_x) {
          parm.sort_on_x = 1
        }
        else {
          parm.sort_on_x = ''
        }
        axios
          .get('chart.json', {params: parm})
          .then(function(response) {
            var option = response.data['data']
            self.option = option
            self.chart.setOption(option)
          })
          .catch(function (error) { // 请求失败处理
            console.log(error);
          });
      },
      sort_data(field) {
        if (this.order.length > 0 && this.order[0] === field) {
          return // Nothing Changed.
        }
        else {
          for (var i = 0; i < this.order.length; ++i) {
            var field_i = this.order[i]
            if (field_i === field || field_i === '-' + field || '-'+field_i == field) {
              this.order.splice(i, 1)
              break
            }
          }
          this.order.unshift(field)
          this.load_data()
        }
      },
      set_format(header, val) {
        if (header.format !== val) {
          header.format=val
          axios.post('set_format.act', {uuid: this.data_id, name: header.name, val: val})
        }
      },
      set_limit_lower(header, val) {
        header.limits[0] = val
        this.load_data(new_limits=[header.name, header.limits[0], header.limits[1]])
      }, 
      set_limit_upper(header, val) {
        header.limits[1] = val
        this.load_data(new_limits=[header.name, header.limits[0], header.limits[1]])
      }, 
      set_x(new_col) {
        if (new_col !== this.x_axis) {
          this.x_axis = new_col
          this.update_chart()
        }
      },
      toggle_sort_x() {
        this.sort_on_x = !this.sort_on_x
        this.update_chart()
      },
      set_y_method(i, method) {
        var y_axis = this.y_axis
        if (i < y_axis.length && y_axis[i][0] !== method) {
          y_axis[i][0] = method
          this.update_chart()
          this.y_axis = y_axis.concat()
        }
      },
      remove_y(i) {
        var y_axis = this.y_axis
        if (i < y_axis.length) {
          y_axis.splice(i, 1)
          this.update_chart()
          this.y_axis = y_axis
        }
      },
      set_page(page) {
        var self = this
        if (self.shape[0] > 0) {
          var n_page = Math.ceil(this.index.length / this.page_size)
          if (page > n_page) {
            page = n_page
          }
          var page_set = [page]
          for (var i = 1; i <= 4; ++i) {
            if (page-i > 1) {
              page_set.unshift(page-i)
            }
          }
          if (page_set[0] !== 1) {
            page_set.unshift(1)
          }
          for (var i = 1; i <= 9; ++i) {
            if (page_set.length < 9 && page+i < n_page) {
              page_set.push(page+i)
            }
            else if (page+i >= n_page) {
              break;
            }
          }
          if (page_set[page_set.length-1] < n_page) {
            page_set.push(n_page)
          }
          this.page = page
          this.page_set = page_set
        }
        else {
          this.page = 1
          this.page_set = []
        }

        var current_page = []
        var start = (this.page-1)*this.page_size+1
        var finish = this.page*this.page_size+1
        if (finish > this.index.length ) {
          finish = this.index.length
        }
        for (var i = start; i < finish; ++i) {
          current_page.push(i)
        }
        this.current_page = current_page
      },
      set_page_all() {
        if (this.index.length > 1000) {
          // TODO: Confirm for big table
        }
        this.page = 'ALL'
        var current_page = []
        for (var i = 0; i < this.index.length; ++i) {
          current_page.push(i)
        }
        this.current_page = current_page
      }
    },
    mounted () {
      var self = this;
      axios
        .get('header.json?uuid='+self.data_id)
        .then(function(response){
          self.header = response.data.data.header
          self.title  = response.data.data.title
          self.shape  = response.data.data.shape
          self.order  = response.data.data.order
          self.load_data()
          self.update_chart()
        })
        .catch(function (error) { // 请求失败处理
          console.log(error);
        });

      var div = $("#cirrus-chart")
      var width = $("#cirrus-table").width()
      div.width(width)
      div.height(width*0.3)
      self.chart = echarts.init(document.getElementById("cirrus-chart"))
    }
  })
