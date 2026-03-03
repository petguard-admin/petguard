import React, { useState } from 'react';
import app from "../firebaseConfig";
import { getDatabase, ref, get } from "firebase/database";
import { useNavigate } from 'react-router-dom';


const UpdateRead = () => {
    let [usersArray, setusersArray] = useState([]);
    
    const navigate = useNavigate();
    const fetchData = async () => {
        const db = getDatabase(app);
        const dbRef = ref(db, "users/name");
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            const mydata = snapshot.val(); 
            const temporaryArray = Object.keys(mydata).map(myFireId => ({
                ...mydata[myFireId],
                id: myFireId
            }))
            setusersArray(temporaryArray);
        }
    }      
  
  return (
    <div>
    
      <button onClick={fetchData}>Get Data</button>
      
       
        <ul >
           {usersArray.map((user, index) => (
          <li key={index}>{user.content}: {user.title} : {user.id}
          {/* <button onClick={() => updateData(user.id)}>Update</button> */}
          </li>
          ))}
        </ul>

        <button onClick={() => navigate('/')}>Home</button>
        <button onClick={() => navigate('/write')}>Write</button>
        <button onClick={() => navigate('/read')}>Read</button>
      
    </div>
  )
}

export default UpdateRead;