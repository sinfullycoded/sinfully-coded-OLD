export default {
    name: 'project',
    title: 'Project',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Title',
            type: 'string',
        },
        {
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
        },
        {
            name: 'status',
            title: 'Status',
            type: 'string',
            options: {
                list: [
                    {
                        title: "Live", 
                        value: "live"
                    },
                    {
                        title: "In Development", 
                        value: "in-development"
                    },
                    {
                        title: "On Hold", 
                        value: "on-hold"
                    },
                    {
                        title: "Inactive", 
                        value: "inactive"
                    }
                ]
            }
        },
        {
            name: 'mainImage',
            title: 'Main image',
            type: 'image',
            options: {
                hotspot: true,
            },
        },
        {
            name: 'body',
            title: 'Body',
            type: 'blockContent',
        },
        {
            name: 'summary',
            title: 'summary',
            type: 'text',
        },
        {
            title: 'Languages',
            name: 'languages',
            type: 'array',
            of: [{ type: 'string' }],
            options: {
                layout: 'tags'
            }
        },
        {
            title: 'Technology',
            name: 'tech',
            type: 'array',
            of: [{ type: 'string' }],
            options: {
                layout: 'tags'
            }
        }
    ],
    preview: {
        select: {
            title: 'title',
            media: 'mainImage',
        },
        prepare(selection) {
            const { author } = selection
            return Object.assign({}, selection, {
                subtitle: author && `by ${author}`,
            })
        },
    },
}
