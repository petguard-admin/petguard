import React, { useState } from 'react';
import app from "../firebaseConfig";
import { getDatabase, ref, get } from "firebase/database";
import { useNavigate } from 'react-router-dom';


const Read = () => {
    let [usersArray, setusersArray] = useState([]);
    
    const navigate = useNavigate();
    const fetchData = async () => {
        const db = getDatabase(app);
        const dbRef = ref(db, "users/name");
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            setusersArray(Object.values(snapshot.val()));
        }

    }      
  
  return (
    <div>
    
      <button onClick={fetchData}>Get Data</button>
       
        <ul >
           {usersArray.map((user, index) => (
          <li key={index}>{user.content}: {user.title}</li>
          ))}
        </ul>

        <button onClick={() => navigate('/')}>Home</button>
        <button onClick={() => navigate('/write')}>Write</button>
        <button onClick={() => navigate('/update')}>Update</button>
      
    </div>
  )
}

export default Read;