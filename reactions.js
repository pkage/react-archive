const open_db = require('./db')

class Reactions {
    constructor(db) {
        if (!db) {
            throw new Error('db required to instantiate!')
        }

        this.db = db
    }

    static async init() {
        const db = await open_db()
        return new Reactions(db)
    }

    async list_latest_posts(count, offset=0) {
        const rows = await this.db.all(`
            SELECT * FROM Posts
                ORDER BY time DESC
                LIMIT ? OFFSET ?
        `, [count, offset])

        return rows
    }

    async search_posts(query) {
        const rows = await this.db.all(`
            SELECT * FROM Posts
                WHERE text MATCH ?
        `, [query])

        return rows
    }

    async get_random(count) {
        const rows = await this.db.all(`
            SELECT * FROM Posts
                ORDER BY random()
                LIMIT ?
        `, [count])

        return rows
    }

    async save_new(id, text, img, time, author_id, author_name) {
        if (await this.id_exists(id)) {
            return false
        }
        await this.db.run(`
            INSERT INTO Posts(id, text, img, time, author_id, author_name) VALUES (?,?,?,?,?,?)
        `, [id, text, img, time, author_id, author_name])

        return true
    }

    async id_exists(id) {
        const row = await this.db.get(`
            SELECT COUNT(1)
                FROM Posts
                WHERE id=?
        `, [id])

        return row['COUNT(1)'] === 1
    }
}

module.exports = Reactions
