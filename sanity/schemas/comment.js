export default {
    name: 'comment',
    type: 'object',
    title: 'Comment',
    fields: [
      {
        name: 'twitter_handle',
        type: 'string',
        title: 'Twitter Handle'
      },
      {
        name: 'comment',
        type: 'text',
      },
      {
        name: 'post',
        type: 'reference',
        to: [
          {type: 'post'}
        ]
      }
    ],
    preview: {
      select: {
        name: 'twitter_handle',
        comment: 'comment',
        post: 'post.title'
      },
      prepare({name, comment, post}) {
        return {
          title: `${name} left a comment on ${post}`,
          subtitle: comment
        }
      }
    }
  }