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
      
      {/* Example 2: CardDescription with a div (invalid) */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Invalid Example</CardTitle>
          <CardDescription>
            <div>This is a div inside CardDescription</div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content here</p>
        </CardContent>
      </Card>
      
      {/* Example 3: CardDescription with a Skeleton (invalid) */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Invalid with Skeleton</CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content here</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestDomNesting;