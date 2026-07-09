import { useState, useEffect } from "react";
import "./App.css";
import Navbar from "./components/navbar.jsx";
import { v4 as uuidv4 } from "uuid";
const API = import.meta.env.VITE_API_URL;

function App() {
  // 1. Cleaned up state: Start with an empty array. MongoDB will fill it.
  const [todos, setTodos] = useState([]);
  const [todo, setTodo] = useState("");
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    // 2. Fetch data from your backend (Fixed from /users to /todos)
    fetch(`${API}/todos`)
      .then((res) => res.json())
      .then((data) => {
        // Map the MongoDB '_id' to your 'id' state so the rest of your app works
        const formattedData = data.map((item) => ({
          id: item._id,
          todo: item.todo,
          isCompleted: item.isCompleted,
        }));
        setTodos(formattedData);
      })
      .catch((err) => console.error("Failed to fetch tasks:", err));
  }, []);

  const handleAdd = async () => {
    if (todo.trim().length === 0) return;

    if (editId) {
      // --- UPDATE EXISTING TASK ---
      
      // 1. Tell database to update the text
      await fetch(`${API}/todos/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todo: todo }), // Send the new text
      });

      // 2. Update the React UI
      setTodos(
        todos.map((item) =>
          item.id === editId ? { ...item, todo: todo } : item
        )
      );
      
      // 3. Clear edit mode
      setEditId(null);
      setTodo("");
      
    } else {
      // --- ADD NEW TASK ---
      
      const response = await fetch(`${API}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todo: todo })
      });
      const newSavedTodo = await response.json();

      setTodos([...todos, { 
        id: newSavedTodo._id, 
        todo: newSavedTodo.todo, 
        isCompleted: newSavedTodo.isCompleted 
      }]);
      setTodo("");
    }
  };

  const handleEdit = (id) => {
    const itemToEdit = todos.find((item) => item.id === id);
    setTodo(itemToEdit.todo); // Put the text in the input box
    setEditId(id); // Remember which task we are currently editing
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?",
    );
    if (confirmDelete) {
      // 1. Tell the database to delete it
      await fetch(`${API}/todos/${id}`, {
        method: "DELETE",
      });

      // 2. Remove it from the React UI
      const newTodos = todos.filter((item) => item.id !== id);
      setTodos(newTodos);
    }
  };

  const handleCheck = async (id) => {
    // 1. Find the item we are clicking so we know its current state
    const itemToToggle = todos.find((item) => item.id === id);

    // 2. Tell the database to flip the boolean
    await fetch(`${API}/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !itemToToggle.isCompleted }),
    });

    // 3. Update the React UI
    setTodos(
      todos.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item,
      ),
    );
  };

  return (
    <>
      <Navbar />
      <div className="heading bg-blue-200 flex p-2 text-gray-600 justify-center">
        <h1 className="text-2xl font-bold">To Do list</h1>
      </div>

      <div className="addtodo">
        <div className="text-lg font-semibold bg-violet-100 p-2 px-4">
          Add your Task
        </div>
        <input
          onChange={(e) => setTodo(e.target.value)}
          value={todo}
          type="text"
          placeholder="Add your task here"
          className="w-4/9 border-2 border-gray-400 rounded-lg p-2 m-2"
        />
        <button
          onClick={handleAdd}
          className="submit bg-violet-500 text-white p-2 rounded-lg hover:bg-violet-600 mx-8 cursor-pointer"
        >
          {editId ? "Save Task" : "Add Task"}
        </button>
      </div>

      <div className="todos">
        {todos.map((item) => {
          return (
            <div key={item.id} className="todo">
              <div
                className={
                  item.isCompleted
                    ? "text flex justify-between bg-green-100 p-2 m-2 rounded-lg"
                    : "text flex justify-between bg-violet-100 p-2 m-2 rounded-lg"
                }
              >
                {/* Conditionally strike-through the text if completed */}
                <div className={item.isCompleted ? "line-through" : ""}>
                  {item.todo}
                </div>

                <div className="buttons">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="delete bg-violet-700 cursor-pointer hover:bg-violet-900 p-2 py-1 text-sm font-bold text-white rounded-md mx-2"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>

                  <button
                    onClick={() => handleEdit(item.id)}
                    className="edit bg-violet-700 cursor-pointer hover:bg-violet-900 p-2 py-1 text-sm font-bold text-white rounded-md mx-2"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>

                  <button
                    onClick={() => handleCheck(item.id)}
                    className="check bg-violet-700 cursor-pointer hover:bg-violet-900 p-2 py-1 text-sm font-bold text-white rounded-md mx-2"
                  >
                    <span className="material-symbols-outlined">
                      check_circle
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default App;