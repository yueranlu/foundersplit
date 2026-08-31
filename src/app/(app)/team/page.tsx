import { DEMO_CURRENT_MEMBER_ID, DEMO_MEMBERS } from "@/lib/demo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TeamPage() {
  const meId = DEMO_CURRENT_MEMBER_ID;

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
            {DEMO_MEMBERS.length} cofounders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {DEMO_MEMBERS.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 py-3"
              >
                <div
                  className="grid h-9 w-9 place-items-center rounded-full text-sm font-medium text-white"
                  style={{ background: m.avatar_color ?? "#94a3b8" }}
                >
                  {m.display_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {m.display_name}
                    {m.id === meId && (
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
                <div className="text-right text-sm text-muted-foreground">
                  {m.id === meId ? "—" : "settled"}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add a cofounder</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="member_name">Name</Label>
                <Input id="member_name" name="member_name" placeholder="Alice" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member_email">Email (optional)</Label>
                <Input
                  id="member_email"
                  name="member_email"
                  type="email"
                  placeholder="alice@example.com"
                />
              </div>
            </div>
            <Button type="submit">Add cofounder</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
