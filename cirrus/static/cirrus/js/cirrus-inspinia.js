

const UserProfile = {
    props: ['user'],
    template: `
    <li>
        <i class="fa" :class="{'fa-user-o': user.is_anonymous, 'fa-user': !user.is_anonymous}"></i> 
        {{ user.name }}
    </li>
    `
}

const BrowsePage = {
    props: ['filter', 'title', 'order'],
    data() {
        return {
            current_path: [],
            folder_set: [],
            file_set: [],
        }
    },
    methods: {
        load() {
            var self = this
            axios.get('list_file.json', 
                {params: {path: self.current_path.join('/')}}
            ).then(function(response) {
                var data = response.data.data
                if (data.path === '') {
                    self.current_path = []
                }
                else {
                    self.current_path = data.path.split('/')
                }
                self.folder_set = data.folders
                self.file_set = data.files
            }).catch(function(error) {

            })
        },
        set_current_path(i) {
            this.current_path = this.current_path.slice(0, i)
            this.load()
        },
        change_dir(name) {
            this.current_path.push(name)
            this.load()
        },
        file_icon(filename) {
            filename = filename.toLowerCase()
            var tokens = filename.split('.')
            var ext = tokens[tokens.length-1]
            if (ext === 'txt' || ext === 'text') {
                return 'fa-file-text-o'
            }
            else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
                return 'fa-file-excel-o'
            }
            else if (ext === 'pdf') {
                return 'fa-file-pdf-o'
            }
            return 'fa-file-o'
        },
        select_file(filename) {
            return this.current_path.join('/') + '/' + filename
        }
    },
    filters: {
        file_size(size) {
            const SURFIX = ['', ' k', ' M', ' G', ' T', ' P', ' E', ' Z', ' Y']
            for (var i = 0; i < SURFIX.length; ++i) {
                if (size < 1024) {
                    return size.toFixed(2)+SURFIX[i]
                }
                else {
                    size = size / 1024
                }
            }
            return size.toFixed(2)+SURFIX[SURFIX.length-1]
        },
        file_time(time) {
            return moment(time*1000).fromNow()
        }
    },
    mounted() {
        this.load()
    },
    template: `
<div class="modal-content">
    <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
        <i class="fa fa-laptop modal-icon"></i>
        <h4 class="modal-title">{{ title }}</h4>
    </div>
    <div class="modal-body">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item">
                    <a role="button" @click="set_current_path(0)">Root</a>
                </li>
                <li class="breadcrumb-item" v-for="(row, i) in current_path">
                    <a role="button" @click="set_current_path(i+1)">{{ row }}</a>
                </li>
            </ol>
        </nav>
        <table class="table table-sm table-striped table-hover">
            <thead>
                <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Size</th>
                    <th>Last Modified</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in folder_set" :key="'folder://'+row.name">
                    <td><i class="fa fa-folder-o"></i></td>
                    <th><a role="button" @click="change_dir(row.name)"> {{ row.name }}</a></th>
                    <td></td>
                    <td>{{ row.time|file_time }}</td>
                </tr>
                <tr v-for="row in file_set" :key="'file://'+row.name">
                    <td>
                        <i class="fa" :class="file_icon(row.name)"></i>
                    </td>
                    <th><a role="button" @click="$emit('select_file', select_file(row.name))"> {{ row.name }}</a></th>
                    <td>{{ row.size|file_size}}</td>
                    <td>{{ row.time|file_time }}</td>
                </tr>
            </tbody>            
        </table>
    </div>
</div>
`
}





const DialogBrowse = {
    data() {
        return {
            'state': 'browse',
            'steps': ['browse', 'split', 'finish']
        }
    },
    components: {
        'browse-page': BrowsePage
    },
    computed: {
        current_page() {
            const PHASES = {
                'browse': 'browse-page'
            }
            return PHASES[this.state]
        },
        current_title() {
            const PHASES = {
                'browse': 'Browse'
            }
            return PHASES[this.state]
        }
    },
    methods: {
        on_select_file(filename) {
            alert (filename)
        }
    },
    template: `
    <component :is="current_page" :title="current_title"
        @select_file="on_select_file"
    ></component>
    `
}

var app = new Vue({
    el: '#cirrus-app',
    components: {
        'user-profile': UserProfile,
        'dlg-browse': DialogBrowse
    },
    data: {
        profile: {
            user: {
                username: 'NOONE',
                name: 'NO ONE',
                is_anonymous: true
            },
            config: {
                page_size: 50,
                chart_ratio: 50
            }
        }
    },
    mounted() {
        var self = this
        axios.get('profile.json').then(function(response) {
            var data = response.data.data
            self.profile = data
        }).catch(function(error) {

        })
    }
})
