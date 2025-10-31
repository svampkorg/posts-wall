import Post from "../models/post.js";
import { isValidObjectId } from "mongoose";
import { deleteImageFromGcp } from "../middleware/files.js";

function getBaseUrl(req) {
  const protocol = req.protocol;
  const host = req.get("X-Forwarded-Host") || req.get("host");
  const url = `${protocol}://${host}`;
  return url;
}

export async function deletePost(req, res, _next) {
  const id = req.params.id;
  const userId = req.userData.userId;

  console.log("requested to delete id ", id);
  try {
    if (isValidObjectId(id)) {
      const postToDelete = await Post.findById(id);
      const deletion = await Post.deleteOne({ _id: id, author: userId });
      console.log("deletion: ", deletion);

      if (!deletion.acknowledged && !result.deletedCount) {
        return res.status(401).json({
          message: "Post delete denied, not authorized",
        });
      }

      console.log("post deleted");
      const count = await Post.estimatedDocumentCount();

      if (postToDelete) {
        await deleteImageFromGcp(postToDelete);
        // NOTE: left for use with local storage on server
        // deleteImageFromPost(postToDelete);
      }

      return res.status(200).json({
        message: "post successfully deleted",
        count: count,
      });
    } else {
      throw Error(`Could not work with ${id} as ObjectID`);
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

export async function getPosts(req, res, _next) {
  const postQuery = Post.find();
  // adding a + infront converts it to number
  const pageSize = +req.query.pagesize;
  const currentPage = +req.query.page;

  let documents;
  let count;

  // NOTE:
  // if currentPage is 1 (first page index, 0) skip the first
  // pageSize number of posts, and fetch the rest.
  // example pageSize 5: 5 * (1 - 1) = 0; skip no pages
  // If currentPage is 2 (second page index, 1) skip the first
  // two * pageSize number of posts, and fetch the rest.
  // example pageSize 5: 5 * (2 - 1) = 5; skip 5 posts
  // limit limits the number of elements returned, cutting the tail.
  if (pageSize && currentPage) {
    try {
      documents = await postQuery
        .skip(pageSize * (currentPage - 1))
        .limit(pageSize);
      // documents = await Post.find({ skip: pageSize * (currentPage - 1), limit: pageSize });
      count = await Post.estimatedDocumentCount();
    } catch (error) {
      console.log("error ", error);
      return res.status(500).json({
        message: error.message,
      });
    }
  } else {
    try {
      documents = await postQuery;
    } catch (error) {
      console.log("error ", error);
      return res.status(500).json({
        message: error.message,
      });
    }
  }

  console.log("documents: ", documents);
  console.log("count: ", count);

  if (!documents || !count) {
    return res.status(200).json({
      message: "No posts found",
    });
  }

  const posts = documents.map((post) => {
    return {
      title: post.title,
      content: post.content,
      id: post._id,
      imagePath: post.imagePath,
      author: post.author,
    };
  });

  console.log("posts in get: ", posts.length);

  return res.status(200).json({
    message: "Posts fetched successfully!",
    posts: posts,
    count: count,
  });
}

export async function getPostWithId(req, res, _next) {
  const id = req.params.id;
  console.log("requested to get post with id ", id);
  try {
    if (isValidObjectId(id)) {
      const post = await Post.findById(id);

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      return res.status(200).json({
        message: "successfully fetched post",
        post: {
          title: post.title,
          content: post.content,
          id: post._id,
          imagePath: post.imagePath,
          author: post.author,
        },
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

export async function updatePost(req, res, _next) {
  const id = req.params.id;
  const userId = req.userData.userId;

  console.log("patch with id ", id);
  try {
    if (!isValidObjectId(id)) {
      throw Error(`unable to work with id of ${id} as ObjectId`);
    }

    const postToChange = await Post.findOne({ _id: id, author: userId });

    if (!req.file) {
      console.log("There was no file provided");

      const result = await Post.updateOne(
        { _id: id, author: userId },
        { title: req.body.title, content: req.body.content },
      );
      if (!result.acknowledged && !result.modifiedCount) {
        return res.status(401).json({
          message: "Post update denied, not authorized",
        });
      }
    } else {
      console.log("There was a file provided");

      // NOTE: left for use with local storage on server
      // const url = getBaseUrl(req);
      const result = await Post.updateOne(
        { _id: id, author: userId },
        {
          title: req.body.title,
          content: req.body.content,
          // NOTE: left for use with local storage on server
          // imagePath: url + `/images/${userId}/` + req.file.filename,
          imagePath: req.file.gcpUrl,
        },
      );
      if (!result.acknowledged && !result.modifiedCount) {
        return res.status(401).json({
          message: "Post update denied, not authorized",
        });
      }

      if (postToChange) {
        await deleteImageFromGcp(postToChange);
        // NOTE: left for use with local storage on server
        // deleteImageFromPost(postToChange);
      }
    }

    const post = await Post.findById(id);
    if (post) {
      return res.status(200).json({
        message: "successfully patched document",
        post: {
          id: post._id,
          title: post.title,
          content: post.content,
          imagePath: post.imagePath,
          author: userId,
        },
      });
    } else {
      return res.status(500).json({
        message: "Could not save document",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: `Update failed: ${error.message}`,
    });
  }
}

export async function savePost(req, res, _next) {
  // NOTE: left for use with local storage on server
  // const url = getBaseUrl(req);
  const userId = req.userData.userId;

  const post = new Post({
    title: req.body.title,
    content: req.body.content,
    // NOTE: left for use with local storage on server
    // imagePath: url + `/images/${userId}/` + req.file.filename,
    imagePath: req.file.gcpUrl,
    author: userId,
  });

  try {
    console.log("request to save post: ", post);
    const savedDocument = await post.save();
    const count = await Post.estimatedDocumentCount();
    console.log("result to save post: ", savedDocument);
    return res.status(201).json({
      message: savedDocument.message,
      post: {
        id: savedDocument._id,
        title: savedDocument.title,
        content: savedDocument.content,
        imagePath: savedDocument.imagePath,
        author: savedDocument.author,
      },
      count: count,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}
