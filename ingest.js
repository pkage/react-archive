//const Reactions = require('./reactions')
const axios = require('axios').default

class Ingest {
    constructor(rxns) {
        this.rxns = rxns
    }

    async resolve_user_id(usernames) {
        let result = await axios.get(`https://api.twitter.com/2/users/by`, {
            params: {
                usernames
            },
            headers: {
                'Authorization': `Bearer ${process.env['TWITTER_BEARER_TOKEN']}`
            }
        })

        result = result.data.data
        return result

        /*
        return result.reduce( (a,c) => {
            a[c.username] = c.id
            return a
        }, {})*/
    }

    async get_all_tweets(uid, username, pagination_token=undefined, stride=20) {
        let current = await axios.get(`https://api.twitter.com/2/users/${uid}/tweets`, {
            params: {
                'expansions': 'attachments.media_keys',
                'tweet.fields': 'attachments,created_at',
                'media.fields': 'url',
                'max_results': stride,
                pagination_token
            },
            headers: {
                'Authorization': `Bearer ${process.env['TWITTER_BEARER_TOKEN']}`
            }
        })

        //console.log(current.data)


        const media_dict = current?.data?.includes?.media
            .reduce((a,c) => {
                a[c.media_key] = c.url
                return a
            }, {})

        if (media_dict === undefined) {
            return []
        }

        //console.log('media_dict', media_dict)

        const text_process = text => text
            .split(' ')
            .filter(w => w.slice(0,12) !== 'https://t.co')
            .join(' ')


        const tweets = current.data.data
            .filter(tw => tw?.attachments?.media_keys)
            .map(tw => ({
                id: tw.id,
                text: text_process(tw.text),
                img: media_dict[tw.attachments.media_keys[0]],
                time: +(new Date(tw.created_at)),
                author_id: uid,
                author_name: username
            }))


        //console.log('should_continue starting...')
        const have_seen_tweets = (await Promise.all(
            tweets.map(t => this.rxns.id_exists(t.id))
        )).some(t => t)

        const next_pg_token = current.data.meta.next_token

        if (next_pg_token !== undefined && !have_seen_tweets) {
            console.log('continuing')
            return [
                ...tweets,
                ...(await this.get_all_tweets(uid, username, next_pg_token, stride))
            ]
        } else {
            console.log(`bottomed out on ${username}`)
            return tweets
        }
    }

    async save_tweets(tweets) {
        return await Promise.all(
            tweets.map(tw => this.rxns.save_new(
                tw.id,
                tw.text,
                tw.img,
                tw.time,
                tw.author_id,
                tw.author_name
            ))
        )
    }

}

module.exports = Ingest
