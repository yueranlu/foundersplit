import { requireMember } from "@/lib/auth";
import { listMembers } from "@/lib/queries";
import { createMember } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function TeamPage() {
  const me = await requireMember();
  const members = await listMembers();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everyone splits every expense evenly. Each cofounder signs in with
          their first name, lowercase.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {members.length} cofounder{members.length === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <div
                  className="grid h-9 w-9 place-items-center rounded-full text-sm font-medium text-white"
                  style={{ background: m.avatar_color ?? "#94a3b8" }}
                >
                  {m.display_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {m.display_name}
                    {m.id === me.id && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    signs in as{" "}
                    <code className="rounded bg-muted px-1 py-0.5 font-mono">
                      {m.first_name}
                    </code>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Adding or removing someone re-splits past spending across the new
            headcount. Anyone with expenses or payments on record can&apos;t be
            removed — settle up first.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Add a cofounder</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createMember} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="display_name">Name</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  placeholder="Alice"
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="alice@example.com"
                  className="rounded-xl"
                />
              </div>
            </div>
            <Button type="submit" className="rounded-xl">
              Add cofounder
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
