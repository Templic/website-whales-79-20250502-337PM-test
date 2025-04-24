/**
 * DataRequestForm.tsx
 * 
 * A component that allows users to submit data subject access requests (DSARs)
 * as required by GDPR, CCPA, and other privacy regulations.
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Form validation schema
const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  requestType: z.enum(['access', 'correction', 'deletion', 'portability', 'restriction', 'objection'], {
    required_error: 'Please select a request type.',
  }),
  additionalInfo: z.string().optional(),
  verificationMethod: z.enum(['email', 'account'], {
    required_error: 'Please select a verification method.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

const DataRequestForm: React.FC = () => {
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      additionalInfo: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    // In a real implementation, you would send this data to your backend
    console.log('Data request submitted:', values);
    
    // Show success toast
    toast({
      title: 'Request Submitted',
      description: 'We have received your request. We will contact you within 30 days.',
      variant: 'default',
    });
    
    // Reset form
    form.reset();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Data Request Form</CardTitle>
        <CardDescription>
          Use this form to exercise your rights under privacy regulations such as GDPR and CCPA.
          We will respond to your request within 30 days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter your email address" {...field} />
                  </FormControl>
                  <FormDescription>
                    We'll use this email to communicate about your request.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="requestType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Request Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="access" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Access my data (receive a copy of your personal data)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="correction" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Correct my data (update inaccurate information)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="deletion" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Delete my data (right to be forgotten)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="portability" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Data portability (receive data in a machine-readable format)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="restriction" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Restrict processing of my data
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="objection" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Object to processing of my data
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide any additional details about your request"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    For correction requests, please specify what information needs to be updated.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="verificationMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Identity Verification Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="email" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Email verification (we'll send a verification link)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="account" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Account verification (if you have an account with us)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    We need to verify your identity to protect your information.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-4">
              <Button type="submit" className="w-full">Submit Request</Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-gray-500">
        <p>
          Your privacy is important to us. We will process your request according to our 
          <a href="/privacy" className="text-primary hover:underline mx-1">Privacy Policy</a>
          and applicable data protection laws.
        </p>
      </CardFooter>
    </Card>
  );
};

export default DataRequestForm;