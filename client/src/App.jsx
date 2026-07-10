import { useState, useEffect } from "react";
import "./App.css";
import Navbar from "./components/navbar.jsx";
import Auth from "./components/Auth.jsx"; // <-- 1. Import your new Auth component
import { v4 as uuidv4 } from "uuid";
const API = import.meta.env.VITE_API_URL;

function App() {
  // 2. Auth State: Check local storage first so users stay logged in on refresh
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [username, setUsername] = useState(localStorage.getItem("username") || "");

  const [todos, setTodos] = useState([]);
  const [todo, setTodo] = useState("");
  const [editId, setEditId] = useState(null);

  // --- LOGOUT FUNCTION ---
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken("");
    setUsername("");
    setTodos([]); // Clear the tasks from the screen for privacy
  };

  useEffect(() => {
    // Only fetch tasks if the user is actually logged in
    if (!token) return;

    // 3. Attach the VIP Wristband to the GET request
    fetch(`${API}/todos`, {
      headers: {
        Authorization: `Bearer ${token}` 
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not authorized");
        return res.json();
      })
      .then((data) => {
        const formattedData = data.map((item) => ({
          id: item._id,
          todo: item.todo,
          isCompleted: item.isCompleted,
        }));
        setTodos(formattedData);
      })
      .catch((err) => {
        console.error("Failed to fetch tasks:", err);
        // If the token is fake or expired, force a logout
        handleLogout(); 
      });
  }, [token]);

  const handleAdd = async () => {
    if (todo.trim().length === 0) return;

    if (editId) {
      // --- UPDATE EXISTING TASK ---
      await fetch(`${API}/todos/${editId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // <-- Wristband
        },
        body: JSON.stringify({ todo: todo }),
      });

      setTodos(
        todos.map((item) =>
          item.id === editId ? { ...item, todo: todo } : item
        )
      );
      
      setEditId(null);
      setTodo("");
      
    } else {
      // --- ADD NEW TASK ---
      const response = await fetch(`${API}/todos`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // <-- Wristband
        },
        body: JSON.stringify({ todo: todo, listType: "personal" }) // Default to personal for now
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
    setTodo(itemToEdit.todo);
    setEditId(id);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this task?");
    if (confirmDelete) {
      const response = await fetch(`${API}/todos/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}` // <-- Wristband
        }
      });

      // If the backend bouncer rejects the delete (e.g. they didn't create it)
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message);
        return;
      }

      const newTodos = todos.filter((item) => item.id !== id);
      setTodos(newTodos);
    }
  };

  const handleCheck = async (id) => {
    const itemToToggle = todos.find((item) => item.id === id);

    await fetch(`${API}/todos/${id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // <-- Wristband
      },
      body: JSON.stringify({ isCompleted: !itemToToggle.isCompleted }),
    });

    setTodos(
      todos.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item,
      ),
    );
  };

  // 4. THE GATEKEEPER: If no token exists, ONLY render the Auth screen!
  if (!token) {
    return <Auth setToken={setToken} setUsername={setUsername} />;
  }

  // 5. THE MAIN APP: Only renders if they are logged in
  return (
    <>
      <Navbar />
      
      {/* Updated Heading to show Username and Logout button */}
      <div className="heading bg-blue-200 flex p-2 text-gray-600 justify-between items-center px-4 md:px-10">
        <h1 className="text-xl md:text-2xl font-bold">To Do list</h1>
        <div className="flex items-center gap-4">
          <span className="font-semibold text-violet-800 hidden md:inline">Hi, {username}!</span>
          <button 
            onClick={handleLogout}
            className="bg-violet-500 hover:bg-violet-700 text-white font-bold py-1 px-3 rounded text-sm transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="addtodo mt-4">
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
                    ? "flex items-center justify-between bg-green-100 p-2 md:p-3 m-2 rounded-lg"
                    : "flex items-center justify-between bg-violet-100 p-2 md:p-3 m-2 rounded-lg"
                }
              >
                <div
                  className={`flex-1 min-w-0 break-words pr-2 md:pr-4 text-sm md:text-base ${
                    item.isCompleted ? "line-through" : ""
                  }`}
                >
                  {item.todo}
                </div>

                <div className="buttons flex gap-1 md:gap-2 shrink-0">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="delete bg-violet-700 cursor-pointer hover:bg-violet-900 w-7 h-7 md:w-9 md:h-9 flex items-center justify-center text-white rounded"
                  >
                    <span className="material-symbols-outlined text-[16px] md:text-[20px]">delete</span>
                  </button>

                  <button
                    onClick={() => handleEdit(item.id)}
                    className="edit bg-violet-700 cursor-pointer hover:bg-violet-900 w-7 h-7 md:w-9 md:h-9 flex items-center justify-center text-white rounded"
                  >
                    <span className="material-symbols-outlined text-[16px] md:text-[20px]">edit</span>
                  </button>

                  <button
                    onClick={() => handleCheck(item.id)}
                    className="check bg-violet-700 cursor-pointer hover:bg-violet-900 w-7 h-7 md:w-9 md:h-9 flex items-center justify-center text-white rounded"
                  >
                    <span className="material-symbols-outlined text-[16px] md:text-[20px]">check_circle</span>
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