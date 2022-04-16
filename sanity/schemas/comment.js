export default {
    name: 'comment',
    type: 'document',
    title: 'Comment',
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
        name: 'twitter_handle',
        comment: 'comment',
        post: 'post.title',
        media: 'image'
      },
      prepare({name, post, media}) {
        return {
          subtitle: `${name} left a comment on ${post}`,
          media
        }
      }
    }
  }