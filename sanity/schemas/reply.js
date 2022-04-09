export default {
    name: 'reply',
    type: 'object',
    title: 'Reply',
    fields: [
      {
        name: 'reply',
        type: 'text',
      },
      {
        name: 'comment',
        type: 'reference',
        to: [
          {type: 'comment'}
        ]
      },
      {
        name: 'author',
        type: 'reference',
        to: [
          {type: 'author'}
        ]
      }
    ],
    preview: {
      select: {
        author: 'author.name',
        comment: 'comment.post.title',
        commenter: 'comment.twitter_handle',
        reply: 'reply'
      },
      prepare({author, comment, commenter, reply}) {
        return {
          title: `${author} replied to ${commenter}'s comment on ${comment}`,
          subtitle: reply
        }
      }
    }
  }