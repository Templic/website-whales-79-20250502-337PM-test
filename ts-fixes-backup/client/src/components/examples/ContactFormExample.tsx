/**
 * ContactFormExample Component
 * 
 * A demonstration component showing how to use centralized Zod schemas
 * with react-hook-form for form validation.
 */

import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Schemas } from '@/types';

// Use the centralized schema for form values
type ContactFormValues = z.infer<typeof Schemas.contactFormSchema>;

/**
 * Component props
 */
interface ContactFormExampleProps {
  onSubmitSuccess?: (data: ContactFormValues) => void;
}

/**
 * ContactFormExample Component
 * 
 * @example
 * <ContactFormExample onSubmitSuccess={(data) => console.log('Form submitted:', data)} />
 */
export const ContactFormExample: React.FC<ContactFormExampleProps> = ({
  onSubmitSuccess
}) => {
  const { toast } = useToast();
  
  // Initialize form with centralized schema
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(Schemas.contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: ''
    }
  });
  
  const onSubmit = async (data: ContactFormValues) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success notification
      toast({
        title: 'Message Sent',
        description: 'Your message has been submitted successfully.',
        variant: 'default',
      });
      
      // Reset form
      form.reset();
      
      // Callback
      if (onSubmitSuccess) {
        onSubmitSuccess(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was a problem sending your message. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Your email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="Message subject" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Your message" 
                  className="min-h-[120px]" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Please provide as much detail as possible.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full md:w-auto"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Sending...' : 'Send Message'}
        </Button>
      </form>
    </Form>
  );
};

export default ContactFormExample;