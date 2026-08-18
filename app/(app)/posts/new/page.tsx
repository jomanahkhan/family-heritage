import { createPost } from "@/app/actions/posts";
import { PostForm } from "@/components/post-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New post</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Share something with the family</CardTitle>
        </CardHeader>
        <CardContent>
          <PostForm action={createPost} />
        </CardContent>
      </Card>
    </div>
  );
}
