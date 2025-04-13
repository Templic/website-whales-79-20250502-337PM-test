import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const TestDomNesting = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">DOM Nesting Test</h1>
      
      {/* Example 1: CardDescription with text (valid) */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Valid Example</CardTitle>
          <CardDescription>This is normal text in a card description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content here</p>
        </CardContent>
      </Card>
      
      {/* Example 2: Corrected approach for showing a div */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Corrected Example</CardTitle>
          <CardDescription>Description text</CardDescription>
        </CardHeader>
        <CardContent>
          <div>This div is now correctly placed in CardContent</div>
        </CardContent>
      </Card>
      
      {/* Example 3: Corrected approach for showing a Skeleton */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Corrected with Skeleton</CardTitle>
          <CardDescription>Loading state description</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    </div>
  );
};

export default TestDomNesting;