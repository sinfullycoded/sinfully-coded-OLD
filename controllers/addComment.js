import { AkismetClient } from 'akismet-api';
import { cosmicReader, cosmicWriter } from '../server.js';
import { Buffer } from 'node:buffer';

export async function addComment(req, res) {

  // skip spam check in development
  if (!process.env.NODE_ENV === 'development') {
    const spamCheckData = {
      ip: req.header('x-forwarded-for') || req.connection.remoteAddress,
      ua: req.headers['user-agent'],
      ref: req.headers.referer,
      content: req.body.comment,
      weburl: req.body.website_url
    }
  
    const isCommentSpammy = await checkCommentSpam(spamCheckData);
  
    if (isCommentSpammy) { return res.status(422).json({ status: 422, message: "unprocessable entity" })}
  } 

  const commentData = {
      postTitle: req.body.post_title,
      postId: req.body.post_id,
      content: req.body.comment,
      ids: req.body.comment_ids
  };

  const participantExists = await findParticipantByName(req.body.name);

  if (!participantExists) {
    let participantData = {
      name: req.body.name,
      weburl: req.body.website_url
    }
    createParticipant(participantData).then((data) => {
      createComment(data, commentData).then((data) => {
        return res.json({status: 'success', comment_id: data.cid})
      });
    })
  } else {
    createComment(participantData, commentData).then((data) => {
      return res.json({status: 'success', comment_id: data.cid})
    });
  }

  async function checkCommentSpam(data) {

    // set up askimet
    const key = process.env.ASKIMET_TOKEN;
    const blog = 'https://sinfullycoded.com';
    const client = new AkismetClient({ key, blog })

    // set up comment data
    const comment = {
      ip: data.ip,
      useragent: data.ua,
      referrer: data.ref,
      type: 'comment',
      content: data.content
    }

    if (data.weburl !== '') { comment['url'] = data.weburl }

    return await client.checkSpam(comment);

  }

  async function findParticipantByName(name) {

    let participantName = name;
    let participantSlug = participantName.toLowerCase().replace(" ", "-");

    const particiantQuery = {
      type: "people",
      slug: participantSlug
    };

    try {
        return await cosmicReader.objects.findOne(particiantQuery).props("id,title")
    } catch(err) {
       return err.status === 404 ? false : 'error';
    }

  }

  async function createParticipant(data) {

    const avatar = data.name;
    const avatarImg = await fetch(`https://api.multiavatar.com/${avatar}.png?apiKey=${process.env.MULTI_AVATAR_APIKEY}`);
    const avatarBlob = await avatarImg.blob();
    const arrayBuffer = await avatarBlob.arrayBuffer();
    const avatarBuffer = Buffer.from(arrayBuffer);

    const cosmicMediaObject = {
      originalname: `${avatar}-${Date.now()}.png`,
      buffer: avatarBuffer,
    };

    const particpantMedia = await cosmicWriter.media.insertOne({
      media: cosmicMediaObject,
      folder: "avatars"
    });

    const particpantAvatar = particpantMedia.media.name;

    const participantDetails = {
      type: "people",
      title: data.name,
      slug: data.name.toLowerCase().replace(" ", "-"),
      thumbnail: particpantAvatar,
      metafields: [
        {
          title: "Website",
          key: "website",
          type: "text",
          value: data.weburl
        }
      ]
    };

    return await cosmicWriter.objects.insertOne(participantDetails);

  }

  async function createComment(participant, comment) {
    const commentDetails = {
      type: "comments",
      title: `New comment from ${participant.object.title} on ${comment.postId}`,
      content: comment.content,
      status: "draft",
      metafields: [
        {
          type: "object",
          title: "Participant",
          key: "participant",
          value: participant.object.id,
          object_type: "people"
        }
      ]
    };

    try {
      const newComment = await cosmicWriter.objects.insertOne(commentDetails);
      return {cid: newComment.id};

    } catch (err) {
      console.log(err)
    }
  }
}