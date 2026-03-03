import React, { useState } from 'react';
import app from "../firebaseConfig";
import { getDatabase, ref, set, push } from "firebase/database";
import { useNavigate } from 'react-router-dom';


const Write = () => {
    let [inputValue1, setinputValue1] = useState("");
    let [inputValue2, setinputValue2] = useState("");

    const navigate = useNavigate();

    const saveData = async () => {
        const db = getDatabase(app);
        const newPostRef = push(ref(db, "users/name"));
        set(newPostRef, {
            title: inputValue1,
            content: inputValue2
        }).then(() => {
           alert("save data successfully");
        }).catch((error) => {
           alert("save data failed");
        });
    }
  
  return (
    <div>
      <input type="text" value={inputValue1} onChange={(e) => setinputValue1(e.target.value)} />
      <input type="text" value={inputValue2} onChange={(e) => setinputValue2(e.target.value)} />
      <button onClick={saveData}>Save</button>

      <button onClick={() => navigate('/update')}>Update</button>
      <button onClick={() => navigate('/write')}>Write</button>
      <button onClick={() => navigate('/read')}>Read</button>
    </div>

    
  )
}

export default Write