import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold font-mono tracking-tight text-primary">404</h1>
        <h2 className="text-xl font-semibold">Target not found</h2>
        <p className="text-muted-foreground max-w-[500px]">
          The coordinates you entered do not exist in this sector. Verify the route and try again.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
