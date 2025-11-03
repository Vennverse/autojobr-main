import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { eq, desc, and, or, sql, inArray } from "drizzle-orm";
import {
  communityPosts,
  postReactions,
  postComments,
  userConnections,
  users,
  insertCommunityPostSchema,
  insertPostReactionSchema,
  insertPostCommentSchema,
  insertUserConnectionSchema,
} from "@shared/schema";
import { isAuthenticated } from "./auth";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads", "community");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed"));
    }
  },
});

router.post("/posts", isAuthenticated, upload.array("media", 10), async (req, res) => {
  try {
    const userId = req.user!.id;
    const { content, postType, visibility, taggedUserIds, taggedCompanies, hashtags } = req.body;

    console.log('[COMMUNITY POST] Request from user:', userId, {
      hasContent: !!content,
      contentLength: content?.length,
      postType,
      visibility,
      filesCount: req.files?.length || 0,
      body: req.body
    });

    if (!content || content.trim() === "") {
      console.log('[COMMUNITY POST] Error: Content is empty');
      return res.status(400).json({ error: "Content is required" });
    }

    console.log('[COMMUNITY POST] Validation passed, preparing data...');

    const files = req.files as Express.Multer.File[];
    const mediaUrls: string[] = [];
    const mediaTypes: string[] = [];

    if (files && files.length > 0) {
      files.forEach((file) => {
        mediaUrls.push(`/uploads/community/${file.filename}`);
        if (file.mimetype.startsWith("image/")) {
          mediaTypes.push("photo");
        } else if (file.mimetype.startsWith("video/")) {
          mediaTypes.push("video");
        }
      });
    }

    let validatedData;
    try {
      validatedData = insertCommunityPostSchema.parse({
        userId,
        content,
        postType: postType || "general",
        visibility: visibility || "public",
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        mediaTypes: mediaTypes.length > 0 ? mediaTypes : undefined,
        taggedUserIds: taggedUserIds ? JSON.parse(taggedUserIds) : undefined,
        taggedCompanies: taggedCompanies ? JSON.parse(taggedCompanies) : undefined,
        hashtags: hashtags ? JSON.parse(hashtags) : undefined,
      });
      console.log('[COMMUNITY POST] Data validated successfully');
    } catch (validationError) {
      console.error('[COMMUNITY POST] Validation error:', validationError);
      return res.status(400).json({ 
        error: "Invalid post data", 
        details: validationError instanceof Error ? validationError.message : "Validation failed" 
      });
    }

    console.log('[COMMUNITY POST] Inserting post into database...');
    const [newPost] = await db.insert(communityPosts).values(validatedData).returning();

    const postWithUser = await db
      .select({
        id: communityPosts.id,
        userId: communityPosts.userId,
        content: communityPosts.content,
        postType: communityPosts.postType,
        mediaUrls: communityPosts.mediaUrls,
        mediaTypes: communityPosts.mediaTypes,
        reactionsCount: communityPosts.reactionsCount,
        commentsCount: communityPosts.commentsCount,
        sharesCount: communityPosts.sharesCount,
        viewsCount: communityPosts.viewsCount,
        visibility: communityPosts.visibility,
        isPinned: communityPosts.isPinned,
        taggedUserIds: communityPosts.taggedUserIds,
        taggedCompanies: communityPosts.taggedCompanies,
        hashtags: communityPosts.hashtags,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(eq(communityPosts.id, newPost.id))
      .limit(1);

    console.log('[COMMUNITY POST] Post created successfully:', postWithUser[0].id);
    res.json(postWithUser[0]);
  } catch (error) {
    console.error("[COMMUNITY POST] Error creating post:", error);
    console.error("[COMMUNITY POST] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    const errorMessage = error instanceof Error ? error.message : "Failed to create post";
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
    });
  }
});

router.get("/posts", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { limit = 20, offset = 0, filter = "all" } = req.query;

    let whereCondition;
    if (filter === "connections") {
      const connections = await db
        .select({ connectedUserId: userConnections.connectedUserId })
        .from(userConnections)
        .where(and(eq(userConnections.userId, userId), eq(userConnections.status, "accepted")));

      const connectedUserIds = connections.map((c) => c.connectedUserId);
      whereCondition = or(
        eq(communityPosts.userId, userId),
        connectedUserIds.length > 0 ? inArray(communityPosts.userId, connectedUserIds) : undefined
      );
    } else if (filter === "my-posts") {
      whereCondition = eq(communityPosts.userId, userId);
    } else {
      whereCondition = eq(communityPosts.visibility, "public");
    }

    const posts = await db
      .select({
        id: communityPosts.id,
        userId: communityPosts.userId,
        content: communityPosts.content,
        postType: communityPosts.postType,
        mediaUrls: communityPosts.mediaUrls,
        mediaTypes: communityPosts.mediaTypes,
        reactionsCount: communityPosts.reactionsCount,
        commentsCount: communityPosts.commentsCount,
        sharesCount: communityPosts.sharesCount,
        viewsCount: communityPosts.viewsCount,
        visibility: communityPosts.visibility,
        isPinned: communityPosts.isPinned,
        taggedUserIds: communityPosts.taggedUserIds,
        taggedCompanies: communityPosts.taggedCompanies,
        hashtags: communityPosts.hashtags,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(whereCondition)
      .orderBy(desc(communityPosts.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const postsWithReactions = await Promise.all(
      posts.map(async (post) => {
        const userReaction = await db
          .select()
          .from(postReactions)
          .where(and(eq(postReactions.postId, post.id), eq(postReactions.userId, userId)))
          .limit(1);

        return {
          ...post,
          userReaction: userReaction[0]?.reactionType || null,
        };
      })
    );

    res.json(postsWithReactions);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

router.post("/posts/:postId/react", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { postId } = req.params;
    const { reactionType } = req.body;

    if (reactionType === "") {
      return res.status(400).json({ error: "Reaction type cannot be empty" });
    }

    if (reactionType === null || reactionType === undefined) {
      const existingReaction = await db
        .select()
        .from(postReactions)
        .where(and(eq(postReactions.postId, Number(postId)), eq(postReactions.userId, userId)))
        .limit(1);

      if (existingReaction.length > 0) {
        await db
          .delete(postReactions)
          .where(and(eq(postReactions.postId, Number(postId)), eq(postReactions.userId, userId)));

        await db
          .update(communityPosts)
          .set({ reactionsCount: sql`${communityPosts.reactionsCount} - 1` })
          .where(eq(communityPosts.id, Number(postId)));

        return res.json({ message: "Reaction removed", reactionType: null });
      } else {
        return res.json({ message: "No reaction to remove", reactionType: null });
      }
    }

    const existingReaction = await db
      .select()
      .from(postReactions)
      .where(and(eq(postReactions.postId, Number(postId)), eq(postReactions.userId, userId)))
      .limit(1);

    if (existingReaction.length > 0) {
      if (existingReaction[0].reactionType === reactionType) {
        await db
          .delete(postReactions)
          .where(and(eq(postReactions.postId, Number(postId)), eq(postReactions.userId, userId)));

        await db
          .update(communityPosts)
          .set({ reactionsCount: sql`${communityPosts.reactionsCount} - 1` })
          .where(eq(communityPosts.id, Number(postId)));

        return res.json({ message: "Reaction removed", reactionType: null });
      } else {
        await db
          .update(postReactions)
          .set({ reactionType })
          .where(and(eq(postReactions.postId, Number(postId)), eq(postReactions.userId, userId)));

        return res.json({ message: "Reaction updated", reactionType });
      }
    }

    const validatedData = insertPostReactionSchema.parse({
      postId: Number(postId),
      userId,
      reactionType,
    });

    await db.insert(postReactions).values(validatedData);

    await db
      .update(communityPosts)
      .set({ reactionsCount: sql`${communityPosts.reactionsCount} + 1` })
      .where(eq(communityPosts.id, Number(postId)));

    res.json({ message: "Reaction added", reactionType });
  } catch (error) {
    console.error("Error reacting to post:", error);
    res.status(500).json({ error: "Failed to react to post" });
  }
});

router.get("/posts/:postId/comments", isAuthenticated, async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await db
      .select({
        id: postComments.id,
        postId: postComments.postId,
        userId: postComments.userId,
        content: postComments.content,
        parentCommentId: postComments.parentCommentId,
        likesCount: postComments.likesCount,
        createdAt: postComments.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(postComments)
      .leftJoin(users, eq(postComments.userId, users.id))
      .where(eq(postComments.postId, Number(postId)))
      .orderBy(postComments.createdAt);

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

router.post("/posts/:postId/comments", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const validatedData = insertPostCommentSchema.parse({
      postId: Number(postId),
      userId,
      content,
      parentCommentId: parentCommentId ? Number(parentCommentId) : undefined,
    });

    const [newComment] = await db.insert(postComments).values(validatedData).returning();

    await db
      .update(communityPosts)
      .set({ commentsCount: sql`${communityPosts.commentsCount} + 1` })
      .where(eq(communityPosts.id, Number(postId)));

    const commentWithUser = await db
      .select({
        id: postComments.id,
        postId: postComments.postId,
        userId: postComments.userId,
        content: postComments.content,
        parentCommentId: postComments.parentCommentId,
        likesCount: postComments.likesCount,
        createdAt: postComments.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(postComments)
      .leftJoin(users, eq(postComments.userId, users.id))
      .where(eq(postComments.id, newComment.id))
      .limit(1);

    res.json(commentWithUser[0]);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

router.post("/connections/follow/:targetUserId", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { targetUserId } = req.params;

    if (userId === targetUserId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const existingConnection = await db
      .select()
      .from(userConnections)
      .where(
        and(eq(userConnections.userId, userId), eq(userConnections.connectedUserId, targetUserId))
      )
      .limit(1);

    if (existingConnection.length > 0) {
      return res.status(400).json({ error: "Already following this user" });
    }

    const validatedData = insertUserConnectionSchema.parse({
      userId,
      connectedUserId: targetUserId,
      connectionType: "follow",
      status: "accepted",
    });

    await db.insert(userConnections).values(validatedData);

    res.json({ message: "Successfully followed user" });
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

router.delete("/connections/unfollow/:targetUserId", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { targetUserId } = req.params;

    await db
      .delete(userConnections)
      .where(
        and(eq(userConnections.userId, userId), eq(userConnections.connectedUserId, targetUserId))
      );

    res.json({ message: "Successfully unfollowed user" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

router.get("/connections", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;

    const connections = await db
      .select({
        id: userConnections.id,
        connectionType: userConnections.connectionType,
        status: userConnections.status,
        createdAt: userConnections.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(userConnections)
      .leftJoin(users, eq(userConnections.connectedUserId, users.id))
      .where(and(eq(userConnections.userId, userId), eq(userConnections.status, "accepted")))
      .orderBy(desc(userConnections.createdAt));

    res.json(connections);
  } catch (error) {
    console.error("Error fetching connections:", error);
    res.status(500).json({ error: "Failed to fetch connections" });
  }
});

router.get("/connections/status/:targetUserId", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { targetUserId } = req.params;

    const connection = await db
      .select()
      .from(userConnections)
      .where(
        and(eq(userConnections.userId, userId), eq(userConnections.connectedUserId, targetUserId))
      )
      .limit(1);

    if (connection.length > 0) {
      res.json({ isFollowing: true, connection: connection[0] });
    } else {
      res.json({ isFollowing: false, connection: null });
    }
  } catch (error) {
    console.error("Error checking connection status:", error);
    res.status(500).json({ error: "Failed to check connection status" });
  }
});

export default router;
