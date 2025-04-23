// client/src/components/ToDoList.tsx

import React, { useState } from 'react';

const ToDoList: React.FC = () => {
  const [task, setTask] = useState('');
  const [toDoList, setToDoList] = useState<string[]>([]);
  const [completedList, setCompletedList] = useState<string[]>([]);

  const addTask = () => {
    if (task) {
      setToDoList([...toDoList, task]);
      setTask('');
    }
  };

  const completeTask = (taskToComplete: string) => {
    setToDoList(toDoList.filter(t => t !== taskToComplete));
    setCompletedList([...completedList, taskToComplete]);
  };

  const removeTask = (taskToRemove: string) => {
    setCompletedList(completedList.filter(t => t !== taskToRemove));
  };

  return (
    <div>
      <h2>To-Do List</h2>
      <input 
        type="text" 
        value={task} 
        onChange={(e) => setTask(e.target.value)} 
        placeholder="Add a new task" 
      />
      <button onClick={addTask}>Add Task</button>

      <h3>Pending Tasks</h3>
      <ul>
        {toDoList.map((item, index) => (
          <li key={index}>
            {item} 
            <button onClick={() => completeTask(item)}>Complete</button>
          </li>
        ))}
      </ul>

      <h3>Completed Tasks</h3>
      <ul>
        {completedList.map((item, index) => (
          <li key={index}>
            {item} 
            <button onClick={() => removeTask(item)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ToDoList;