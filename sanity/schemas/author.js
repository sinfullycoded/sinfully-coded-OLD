export default {
  name: 'author',
  title: 'Author',
  type: 'object',
  fieldsets: [
    {
      name: 'social', 
      title: 'Social media handles',
      options: {
        collapsible: true,
        collapsed: false,
      }
    }
  ],
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'bio',
      title: 'Bio',
      type: 'text',
    },
    {
      title: 'Twitter',
      name: 'twitter',
      type: 'string',
      fieldset: 'social'
    },
    {
      title: 'Github',
      name: 'github',
      type: 'string',
      fieldset: 'social'
    },
    {
      title: 'Stack Overflow',
      name: 'stack_overflow',
      type: 'string',
      fieldset: 'social'
    }
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
    },
  },
}
