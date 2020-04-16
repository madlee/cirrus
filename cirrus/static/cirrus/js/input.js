const PastePage = {
    data: {
        content: '',
        uuid: ''
    },
    methods: {
        next() {
            var self = this
            axios.post('paste_data.act').then(

            ).catch()
        }
    },
    template: `
  <form>
    <br>
    <div class="form-group">
      <label>
        Paste Your Data here <i class="fa fa-hand-o-down"></i>
      </label>
      <textarea class="form-control" rows="5" v-model='content'></textarea>
    </div>
  </form>
    `
}

const BorwsePage = {

    template: `

    `
}

const SplitPage = {
    template: `

    `
}


const UploadPage = {
    template: `
    `
}

const FinishPage = {
    template: `
    `
}



const DialogPasteData = {
    components: {
        'paste-page': PastePage,
        'split-page': SplitPage,
        'finish-page': FinishPage
    },
    template: `
  <div class="modal-dialog modal-xl" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title"><i class="fas fa-paste"></i> Paste Data</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <ul class="nav nav-pills nav-fill" role="tablist">
          <li class="nav-item">
            <a class="nav-link active" role="wizard" aria-controls="paste" aria-selected="true">Paste</a>
          </li>
          <li class="nav-item">
            <a class="nav-link disabled" role="wizard" aria-controls="split" aria-selected="false">Split</a>
          </li>
          <li class="nav-item">
            <a class="nav-link disabled" role="wizard" aria-controls="upload" aria-selected="false">Upload</a>
          </li>
        </ul>
        <div class="tab-content">
          <component></component>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary">Next</button>
      </div>
    </div>
  </div>
    `
}

const DialogBrowseData = {
    template: `
    `
}

const DialogUploadData = {
    template: `
    `
}


const DialogBambooData = {
    template: `
    `
}
