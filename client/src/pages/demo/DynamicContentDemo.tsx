import React from 'react';
import { DynamicContent } from '@/components/content';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/layout';

/**
 * Demo page to showcase how dynamic content management works
 * This page shows how content managed through the admin panel 
 * can be displayed in various parts of the website
 */
const DynamicContentDemo = () => {
  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">
            <DynamicContent
              contentKey="dynamic-demo-title"
              fallback="Dynamic Content Management Demo"
            />
          </h1>
          <p className="text-muted-foreground mt-2">
            <DynamicContent
              contentKey="dynamic-demo-subtitle"
              fallback="This page demonstrates how content managed through the admin panel can be displayed throughout the website"
            />
          </p>
        </div>

        <Separator className="my-8" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>
                <DynamicContent
                  contentKey="dynamic-demo-card1-title"
                  fallback="Text Content Example"
                />
              </CardTitle>
              <CardDescription>
                <DynamicContent
                  contentKey="dynamic-demo-card1-subtitle"
                  fallback="Displaying simple text content"
                />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                <DynamicContent
                  contentKey="dynamic-demo-card1-content"
                  fallback="This text can be edited by administrators through the Content Management page. Changes made there will be immediately reflected here without requiring any code changes. This makes it easy to update website text without developer involvement."
                />
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <DynamicContent
                  contentKey="dynamic-demo-card2-title"
                  fallback="HTML Content Example"
                />
              </CardTitle>
              <CardDescription>
                <DynamicContent
                  contentKey="dynamic-demo-card2-subtitle"
                  fallback="Displaying HTML content with formatting"
                />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DynamicContent
                contentKey="dynamic-demo-card2-content"
                fallback={`
                  <p>HTML content allows for <strong>rich formatting</strong>, such as:</p>
                  <ul>
                    <li>Lists with <em>emphasis</em></li>
                    <li>Links to <a href="/about" class="text-blue-600 hover:underline">other pages</a></li>
                    <li>And other HTML elements</li>
                  </ul>
                  <p>Administrators can use the rich text editor to create and update this content.</p>
                `}
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                <DynamicContent
                  contentKey="dynamic-demo-image-title"
                  fallback="Image Content Example"
                />
              </CardTitle>
              <CardDescription>
                <DynamicContent
                  contentKey="dynamic-demo-image-subtitle"
                  fallback="Displaying dynamic images that can be updated by administrators"
                />
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <DynamicContent
                contentKey="dynamic-demo-image"
                asImage={true}
                fallback="https://via.placeholder.com/800x400?text=Dynamic+Image+Content"
                imageProps={{
                  alt: "Dynamic image that can be managed through the admin panel",
                  className: "rounded-lg max-h-80 object-cover shadow-md"
                }}
              />
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <div className="bg-primary/5 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">
            <DynamicContent
              contentKey="dynamic-demo-section-title"
              fallback="How to Use Dynamic Content"
            />
          </h2>
          <div className="prose prose-slate max-w-none">
            <DynamicContent
              contentKey="dynamic-demo-section-content"
              fallback={`
                <p>To add dynamic content to your website:</p>
                <ol>
                  <li>Go to the Admin Portal and navigate to the Content Management page</li>
                  <li>Create a new content item with a unique key</li>
                  <li>Enter the content (text, HTML, or image URL) that you want to display</li>
                  <li>Categorize it by page and section for better organization</li>
                  <li>Save the content</li>
                </ol>
                <p>Then, use the DynamicContent component in your code like this:</p>
                <pre><code>&lt;DynamicContent contentKey="your-unique-key" fallback="Fallback text" /&gt;</code></pre>
                <p>The content will be automatically fetched and displayed, and can be updated at any time through the admin panel without requiring code changes.</p>
              `}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DynamicContentDemo;