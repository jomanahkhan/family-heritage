import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { createComment, deleteComment, deletePost, toggleLike } from "@/app/actions/posts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const typeLabels: Record<string, string> = {
  ANNOUNCEMENT: "Announcement",
  EVENT_INVITE: "Event invite",
  ACHIEVEMENT: "Achievement",
};

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
      likes: { select: { userId: true } },
    },
  });

  if (!post) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const isAuthor = post.authorId === session.user.id;
  const hasLiked = post.likes.some((like) => like.userId === session.user.id);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{typeLabels[post.type]}</Badge>
            <span className="text-sm text-muted-foreground">
              {post.author.name} · {post.createdAt.toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-2xl font-semibold">{post.title}</h1>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {post.type === "EVENT_INVITE" && (post.eventDate || post.eventLocation) && (
            <p className="text-sm text-muted-foreground">
              {post.eventDate && post.eventDate.toLocaleDateString()}
              {post.eventDate && post.eventLocation && " · "}
              {post.eventLocation}
            </p>
          )}
          <p className="whitespace-pre-wrap">{post.body}</p>

          <div className="flex items-center gap-3">
            <form action={toggleLike.bind(null, post.id)}>
              <Button type="submit" variant={hasLiked ? "default" : "outline"} size="sm">
                {hasLiked ? "Liked" : "Like"} · {post.likes.length}
              </Button>
            </form>
            {(isAuthor || isAdmin) && (
              <form action={deletePost.bind(null, post.id)}>
                <Button type="submit" variant="destructive" size="sm">
                  Delete post
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-medium">Comments</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {post.comments.length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
          <ul className="flex flex-col gap-3">
            {post.comments.map((comment) => (
              <li key={comment.id} className="flex flex-col gap-1 border-b pb-3 last:border-b-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{comment.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {comment.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{comment.body}</p>
                {(comment.authorId === session.user.id || isAdmin) && (
                  <form action={deleteComment.bind(null, comment.id, post.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Delete
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>

          <form action={createComment.bind(null, post.id)} className="flex flex-col gap-2">
            <Textarea name="body" rows={2} placeholder="Write a comment…" required />
            <div>
              <Button type="submit" size="sm">
                Comment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
