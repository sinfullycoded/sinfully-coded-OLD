import { checkPageTheme } from "../utils.js";
import { cosmicReader } from '../server.js';

export async function getProjects(req, res) {

    const projectsQuery = {
        type: "projects"
    };

    const props = [
        "id",
        "created_at",
        "published_at",
        "modified_at",
        "status",
        "slug",
        "title",
        "content",
        "metadata",
        "thumbnail",
    ];

    const getProjects = await cosmicReader.objects
        .find(projectsQuery)
        .props(props.toString())
        .status("published")
        .limit(10)

    let projects = getProjects.objects;

    res.render('projects', { projects: projects, page_title: 'Projects (sinfullycoded.com)', page: 'projects', theme: checkPageTheme(req), nonce: res.locals.nonce });
}