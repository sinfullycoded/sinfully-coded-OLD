import { AkismetClient } from 'akismet-api';
import { sanity } from '../server.js';
import axios from 'axios';

export function addComment(req, res) {

  // set up askimet
  const key = process.env.ASKIMET_TOKEN;
  const blog = 'https://sinfullycoded.com'
  const client = new AkismetClient({ key, blog })

  // set up comment data
  const comment = {
    ip: req.header('x-forwarded-for') || req.connection.remoteAddress,
    useragent: req.headers['user-agent'],
    referrer: req.headers.referer,
    type: 'comment',
    content: req.body.comment
  }

  if (req.body.website_url !== '') { comment['url'] = req.body.website_url }

  // temp for testing
  if (process.env.NODE_ENV === 'development') {
    comment['role'] = 'administrator';
    comment['isTest'] = true;
  }

  // check comment for spam only returns true/false
  client.checkSpam(comment).then(istrue => {
    if (istrue) {
      // it's spam, abort mission!
      return res.status(422).json({status: 422, message: "unprocessable entity"})
    } else {
      // check for existing commentor to attach to comment
      const query = '*[_type == "commenter" && twitter_handle == $handle]{_id, twitter_handle, website_url, avatar_url}'
      const params = { handle: req.body.twitter_handle }

      // TODO: Fix this logic because it's not sound and it's very finicky!!
      sanity.fetch(query, params).then((commenters) => {
        if (commenters.length === 0) {

          // Get profile pic from twitter
          axios.request({
            url: `https://api.twitter.com/2/users/by/username/${req.body.twitter_handle}?user.fields=profile_image_url`, 
            method: 'GET',
            headers: { 
              Authorization: `Bearer ${process.env.TWITTER_TOKEN}` 
            }
          })
          .then(result => result.data)
            .then(avatar => {

              if(avatar.error) {
                return res.status(400).json({status: 400, message: 'user not found'})
              }

              const commenter = {
                _type: 'commenter',
                twitter_handle: req.body.twitter_handle,
                website_url: req.body.website_url,
                avatar_url: avatar.data.profile_image_url,
              }

              sanity.create(commenter)
                .then((res) => res._id)
                .then((commenterID) => {
                  createComment(req, res, commenterID)
                })
                .catch(err => console.error(err))
            })
            .catch(err => console.error(err))
        } else {
          // we have an existing commenter, use their id
          createComment(req, res, commenters[0]._id)
        }
      })
    }

    function createComment(req, res, commenterID) {
      
      // data for creating comment
      const comment = {
        _type: 'comment',
        _id: 'drafts.',
        comment: req.body.comment,
        post: {
          _type: 'reference',
          _ref: req.body.post_id
        },
        commenter: {
          _type: 'reference',
          _ref: commenterID
        }
      }

      // create comment via sanity sdk
      sanity.create(comment)
        .then((newComment) => res.json({ status: 'success', id: newComment._id, commenter: commenterID }))
        .catch(err => {throw new Error({status: error, message: err})})
    }
  })
  .catch(err => console.error('Something went wrong:', err.message))

}