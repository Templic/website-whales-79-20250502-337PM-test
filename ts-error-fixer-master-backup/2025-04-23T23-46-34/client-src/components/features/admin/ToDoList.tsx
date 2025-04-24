/**
 * ToDoList.tsx
 * 
 * Component Type: feature
 * Migrated as part of the repository reorganization.
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { trackEvent } from "@/lib/analytics";

export const ToDoList: React.FC = () => {
  const [task, setTask] = useState('');
  const [toDoList, setToDoList] = useState<string[]>([]);
  const [completedList, setCompletedList] = useState<string[]>([]);

  const addTask = () => {
    if (task) {
      // Track task creation with Google Analytics
      trackEvent(
        'Task Management',
        'Add Task',
        'Admin Portal'
      );
      
      setToDoList([...toDoList, task]);
      setTask('');
    }
  };

  const completeTask = (taskToComplete: string) => {
    // Track task completion with Google Analytics
    trackEvent(
      'Task Management',
      'Complete Task',
      'Admin Portal'
    );
    
    setToDoList(toDoList.filter(t => t !== taskToComplete));
    setCompletedList([...completedList, taskToComplete]);
  };

  const removeTask = (taskToRemove: string) => {
    // Track task removal with Google Analytics
    trackEvent(
      'Task Management',
      'Remove Task',
      'Admin Portal'
    );
    
    setCompletedList(completedList.filter(t => t !== taskToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && task) {
      addTask();
    }
  };

  return (
    <Card className="shadow-lg bg-[rgba(10,50,92,0.2)]">
      <CardHeader>
        <CardTitle className="text-2xl text-[#00ebd6] flex justify-between items-center">
          Admin To-Do List
          <Badge variant="outline" className="ml-2">
            {toDoList.length} pending
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new task"
            className="flex-grow"
          />
          <Button 
            onClick={addTask} 
            disabled={!task} 
            className="bg-[#00ebd6] text-[#303436] hover:bg-[#00c2b0]"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>

        <div className="space-y-4">
          {toDoList.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Pending Tasks</h3>
              <ul className="space-y-2">
                {toDoList.map((item, index) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-[rgba(48,52,54,0.3)] rounded-md">
                    <div className="flex items-center space-x-2">
                      <Checkbox id={`task-${index}`} onCheckedChange={() => completeTask(item)} />
                      <label htmlFor={`task-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {item}
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {completedList.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Completed Tasks</h3>
              <ul className="space-y-2">
                {completedList.map((item, index) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-[rgba(48,52,54,0.1)] rounded-md">
                    <div className="flex items-center space-x-2 line-through text-muted-foreground">
                      <Checkbox id={`completed-${index}`} checked disabled />
                      <label htmlFor={`completed-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {item}
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTask(item)}
                      className="h-7 w-7 p-0 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};