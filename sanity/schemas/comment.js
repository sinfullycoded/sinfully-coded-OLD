import React from 'react';
import { FaComments } from "react-icons/fa";

export default {
    name: 'comment',
    type: 'document',
    title: 'Comment',
    icon: FaComments,
    fields: [
      {
        name: 'comment',
        type: 'text',
        title: 'Comment'
      },
      {
        name: 'commenter',
        title: 'Commenter',
        type: 'reference',
        to: {type: 'commenter'},
      },
      {
        name: 'post',
        type: 'reference',
        title: 'Post',
        to: [
          {type: 'post'}
        ]
      }
    ],
    preview: {
      select: {
        name: 'commenter.twitter_handle',
        comment: 'comment',
        post: 'post.title',
        media: 'commenter.avatar_url'
      },
      prepare({name, post, media}) {
        return {
          title: `New comment from @${name}`,
          subtitle: `on ${post}`,
          media: <img src={media} alt={name} />
        }
      }
    }
  }