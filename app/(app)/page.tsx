import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const typeLabels: Record<string, string> = {
  ANNOUNCEMENT: "Announcement",
  EVENT_INVITE: "Event invite",
  ACHIEVEMENT: "Achievement",
};

export default async function FeedPage() {
  await requireUser();

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Feed</h1>
          <p className="text-muted-foreground">
            Announcements, invites, and achievements from the family.
          </p>
        </div>
        <Button render={<Link href="/posts/new">New post</Link>} />
      </div>

      <div className="flex flex-col gap-3">
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No posts yet. Be the first to share something.
          </p>
        )}
        {posts.map((post) => (
          <Link key={post.id} href={`/posts/${post.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardContent className="flex flex-col gap-2 py-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{typeLabels[post.type]}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {post.author.name} · {post.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <span className="font-medium">{post.title}</span>
                <p className="line-clamp-2 text-sm text-muted-foreground">{post.body}</p>
                <span className="text-xs text-muted-foreground">
                  {post._count.likes} like{post._count.likes === 1 ? "" : "s"} ·{" "}
                  {post._count.comments} comment{post._count.comments === 1 ? "" : "s"}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
