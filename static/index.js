
const LOAD_STEP_SIZE = 50

const make_query = q => 
    Object.keys(q)
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(q[k])}`)
        .join('&')

const load_chrono = async (count, offset=0) => {
    const res = await fetch(`/api/chrono?${make_query({count, offset})}`)
    
    return (await res.json()).tweets
}

const load_query = async query => {
    const res = await fetch(`/api/query?${make_query({query})}`)
    
    return (await res.json()).tweets

}

const load_random = async count => {
    const res = await fetch(`/api/random?${make_query({count})}`)
    
    return (await res.json()).tweets
}


const app = new Vue({
    el: '#app',
    data: {
        items: [],
        item: {},
        mode: 'chronological',
        loading: true,
        modal_open: false,
        query: ''
    },
    created: async function() {
        this.items = (await load_chrono(LOAD_STEP_SIZE,0))
        this.loading = false
        window.addEventListener('keyup', e => {
            if (e.key === 'Escape') {
                this.close_modal()
            } else if (e.key === 'ArrowLeft' || e.key === 'k') {
                this.handle_pageleft()
            } else if (e.key === 'ArrowRight' || e.key === 'j') {
                this.handle_pageright()
            }
        })
    },
    methods: {
        select_querybox: async function() {
            if (this.mode === 'search') {
                return
            }
            this.mode  = 'search'
            document.querySelector('#search').click()
        },

        select_random: async function() {
            this.mode  = 'random'
            this.items = await load_random(LOAD_STEP_SIZE)
        },
        select_chronological: async function() {
            if (this.mode === 'chronological') {
                return
            }
            this.mode  = 'chronological'
            this.items = await load_chrono(LOAD_STEP_SIZE,0)
        },
        handle_loadmore: async function() {
            this.loading = true

            if (this.mode === 'chronological') {
                this.items = [
                    ...this.items,
                    ...(await load_chrono(LOAD_STEP_SIZE,this.items.length))
                ]
            } else if (this.mode === 'random') {
                this.items = [
                    ...this.items,
                    ...(await load_random(LOAD_STEP_SIZE))
                ]
            } else {
            }

            this.loading = false
        },
        open_modal: function(item) {
            this.modal_open = true
            this.item = item
            document.body.classList.add('has-open-modal')
        },
        close_modal: function() {
            this.modal_open = false
            document.body.classList.remove('has-open-modal')
        },
        handle_query_keyup: async function() {
            if (this.query.length <= 1) {
                this.items = []
            } else {
                this.items = await load_query(this.query)
            }
        },
        handle_pageleft: function() {
            if (!this.modal_open) {
                return
            }

            let idx = this.items.indexOf(this.item)

            if (idx === 0) {
                return
            }

            idx--

            this.item = this.items[idx]
        },
        handle_pageright: async function() {
            if (!this.modal_open) {
                return
            }

            let idx = this.items.indexOf(this.item)

            idx++;

            if (this.items.length <= idx) {
                await this.handle_loadmore()
            }

            if (this.items.length <= idx) {
                // no more posts.
                return
            }

            this.item = this.items[idx]
        }
    }
})
