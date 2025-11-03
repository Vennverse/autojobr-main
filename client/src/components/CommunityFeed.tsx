import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ThumbsUp,
  PartyPopper,
  Heart,
  MessageCircle,
  UserPlus,
  UserCheck,
  Image as ImageIcon,
  Video,
  Send,
  Trophy,
  Briefcase,
  Lightbulb,
  Star,
  Upload,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: number;
  userId: string;
  content: string;
  postType: string;
  mediaUrls?: string[];
  mediaTypes?: string[];
  reactionsCount: number;
  commentsCount: number;
  visibility: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl: string | null;
  };
  userReaction: string | null;
}

interface Comment {
  id: number;
  postId: number;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
}

const POST_TYPE_CONFIG = {
  general: { label: "General Update", icon: MessageCircle, color: "bg-blue-500" },
  success: { label: "Success Story", icon: Trophy, color: "bg-yellow-500" },
  achievement: { label: "Achievement", icon: Star, color: "bg-purple-500" },
  tip: { label: "Career Tip", icon: Lightbulb, color: "bg-green-500" },
  job_offer: { label: "Job Offer", icon: Briefcase, color: "bg-indigo-500" },
};

const REACTION_EMOJIS = {
  like: { emoji: "👍", label: "Like", icon: ThumbsUp },
  celebrate: { emoji: "🎉", label: "Celebrate", icon: PartyPopper },
  support: { emoji: "❤️", label: "Support", icon: Heart },
};

export function CommunityFeed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState("general");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [expandedComments, setExpandedComments] = useState<number | null>(null);

  // Fetch posts
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/community/posts"],
    retry: false,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest("/api/community/posts", {
        method: "POST",
        body: formData,
        headers: {}, // Let browser set Content-Type for multipart/form-data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      setPostContent("");
      setPostType("general");
      setSelectedFiles([]);
      toast({
        title: "Success!",
        description: "Your post has been shared with the community.",
      });
    },
    onError: (error: any) => {
      console.error('Failed to create post:', error);
      const errorMessage = error?.message || error?.error || "Failed to create post. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // React to post mutation
  const reactToPostMutation = useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: number; reactionType: string | null }) => {
      return apiRequest(`/api/community/posts/${postId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
    },
  });

  // Follow user mutation
  const followUserMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      return apiRequest(`/api/community/connections/follow/${targetUserId}`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      toast({
        title: "Success!",
        description: "You are now following this user.",
      });
    },
  });

  const handleCreatePost = () => {
    if (!postContent.trim() && selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please add some content or media to your post.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("content", postContent.trim());
    formData.append("postType", postType);
    formData.append("visibility", "public");
    
    // Backend expects field name "media" (matches upload.array("media", 10))
    selectedFiles.forEach((file) => {
      formData.append("media", file);
    });

    console.log('Creating post with:', {
      content: postContent.trim(),
      postType,
      filesCount: selectedFiles.length
    });

    createPostMutation.mutate(formData);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB
      return (isImage || isVideo) && isValidSize;
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Some files were skipped. Only images and videos under 50MB are allowed.",
        variant: "destructive",
      });
    }

    setSelectedFiles([...selectedFiles, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleReaction = (postId: number, reactionType: string, currentReaction: string | null) => {
    reactToPostMutation.mutate({
      postId,
      reactionType: currentReaction === reactionType ? null : reactionType,
    });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community feed...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="community-feed">
      {/* Post Composer */}
      <Card className="border-2 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Share Your Success
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10" data-testid="avatar-current-user">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback>{getInitials(user?.firstName, user?.lastName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Share your wins, tips, or connect with fellow job seekers..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="min-h-[100px] resize-none"
                data-testid="textarea-post-content"
              />

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="relative bg-slate-100 dark:bg-slate-800 rounded-lg p-2 flex items-center gap-2"
                    >
                      {file.type.startsWith("image/") ? (
                        <ImageIcon className="w-4 h-4" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                      <span className="text-sm max-w-[150px] truncate">{file.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => removeFile(index)}
                        data-testid={`button-remove-file-${index}`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Select value={postType} onValueChange={setPostType}>
                    <SelectTrigger className="w-[180px]" data-testid="select-post-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(POST_TYPE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="w-4 h-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <label htmlFor="file-upload">
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("file-upload")?.click()}
                      data-testid="button-upload-media"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Add Media
                    </Button>
                  </label>
                </div>

                <Button
                  onClick={handleCreatePost}
                  disabled={createPostMutation.isPending}
                  data-testid="button-create-post"
                >
                  {createPostMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-gray-600">Be the first to share your success story!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id || ""}
              onReaction={handleReaction}
              onFollow={followUserMutation.mutate}
              expandedComments={expandedComments}
              setExpandedComments={setExpandedComments}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onReaction: (postId: number, reactionType: string, currentReaction: string | null) => void;
  onFollow: (userId: string) => void;
  expandedComments: number | null;
  setExpandedComments: (postId: number | null) => void;
}

function PostCard({
  post,
  currentUserId,
  onReaction,
  onFollow,
  expandedComments,
  setExpandedComments,
}: PostCardProps) {
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const isOwnPost = post.userId === currentUserId;

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["/api/community/posts", post.id, "comments"],
    enabled: expandedComments === post.id,
    retry: false,
  });

  const { data: connectionStatus } = useQuery({
    queryKey: ["/api/community/connections/status", post.userId],
    enabled: !isOwnPost,
    retry: false,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/community/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts", post.id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      setCommentText("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive",
      });
    },
  });

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText);
  };

  const postTypeConfig = POST_TYPE_CONFIG[post.postType as keyof typeof POST_TYPE_CONFIG] || POST_TYPE_CONFIG.general;
  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const isFollowing = connectionStatus?.isFollowing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card data-testid={`card-post-${post.id}`}>
        <CardContent className="p-6">
          {/* Post Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-3 flex-1">
              <Avatar className="w-12 h-12" data-testid={`avatar-user-${post.userId}`}>
                <AvatarImage src={post.user.profileImageUrl || undefined} />
                <AvatarFallback>
                  {getInitials(post.user.firstName, post.user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold" data-testid={`text-username-${post.id}`}>
                    {post.user.firstName} {post.user.lastName}
                  </h4>
                  <Badge className={`${postTypeConfig.color} text-white`}>
                    <postTypeConfig.icon className="w-3 h-3 mr-1" />
                    {postTypeConfig.label}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500" data-testid={`text-timestamp-${post.id}`}>
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            {!isOwnPost && (
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "default"}
                onClick={() => onFollow(post.userId)}
                data-testid={`button-follow-${post.id}`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 mr-1" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Connect
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <p className="text-slate-900 dark:text-white whitespace-pre-wrap" data-testid={`text-content-${post.id}`}>
              {post.content}
            </p>
          </div>

          {/* Media */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className={`grid gap-2 mb-4 ${post.mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {post.mediaUrls.map((url, index) => {
                const mediaType = post.mediaTypes?.[index] || "photo";
                return (
                  <div key={index} className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {mediaType === "photo" ? (
                      <img
                        src={url}
                        alt="Post media"
                        className="w-full h-auto max-h-96 object-cover"
                        data-testid={`img-media-${post.id}-${index}`}
                      />
                    ) : (
                      <video
                        src={url}
                        controls
                        className="w-full h-auto max-h-96"
                        data-testid={`video-media-${post.id}-${index}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Separator className="mb-4" />

          {/* Reactions and Comments Count */}
          <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span data-testid={`text-reactions-count-${post.id}`}>
                {post.reactionsCount} {post.reactionsCount === 1 ? "reaction" : "reactions"}
              </span>
              <span data-testid={`text-comments-count-${post.id}`}>
                {post.commentsCount} {post.commentsCount === 1 ? "comment" : "comments"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {Object.entries(REACTION_EMOJIS).map(([type, config]) => (
              <Button
                key={type}
                variant={post.userReaction === type ? "default" : "outline"}
                size="sm"
                onClick={() => onReaction(post.id, type, post.userReaction)}
                data-testid={`button-react-${type}-${post.id}`}
              >
                <span className="mr-1">{config.emoji}</span>
                {config.label}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
              data-testid={`button-toggle-comments-${post.id}`}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Comment
            </Button>
          </div>

          {/* Comments Section */}
          <AnimatePresence>
            {expandedComments === post.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <Separator />
                
                {/* Add Comment */}
                <div className="flex gap-2 mt-4">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[60px] resize-none"
                    data-testid={`textarea-comment-${post.id}`}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || addCommentMutation.isPending}
                    data-testid={`button-submit-comment-${post.id}`}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Comments List */}
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3" data-testid={`comment-${comment.id}`}>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.user.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {getInitials(comment.user.firstName, comment.user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm">
                              {comment.user.firstName} {comment.user.lastName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No comments yet. Be the first to comment!</p>
                    )}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
