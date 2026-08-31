import { signIn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-foreground text-background font-semibold text-xl">
            FS
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">FounderSplit</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with your first name.
            </p>
          </div>
        </div>

        <form action={signIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              name="name"
              placeholder="yueran"
              autoComplete="off"
              autoFocus
              spellCheck={false}
              autoCapitalize="none"
            />
          </div>
          <Button type="submit" className="w-full">Continue</Button>
          <p className="text-center text-xs text-muted-foreground">
            Just your first name, lowercase. No password.
          </p>
        </form>
      </div>
    </main>
  );
}
