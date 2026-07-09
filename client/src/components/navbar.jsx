import React from "react";

const navbar = () => {
  return (
    <div className="flex justify-between bg-blue-100 p-4 text-green-350 rounded-xl m-2">
      <div className="logo text-lg font-bold">
        Your To Do Planner
      </div>
        <ul className="flex gap-8">
          <li className="cursor-pointer transition-all hover:font-bold">About</li>
          <li className="cursor-pointer transition-all hover:font-bold">Home</li>
          <li className="cursor-pointer transition-all hover:font-bold">Contact</li>
        </ul>
    </div>
  );
};

export default navbar;
