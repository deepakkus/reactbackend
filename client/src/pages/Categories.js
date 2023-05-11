import * as React from 'react';
import Input from "../Components/Input";
import Container from "../Components/Container";
import Button from "../Components/Button";
import Form from "../Components/Form";
import Sidebar from "../Components/Sidebar";
import '../App.css';
import {Row,Col } from "reactstrap";
import HttpClient from "../utils/HttpClient";
import Box from "@mui/material/Box";
import Grid from '@mui/material/Grid'; 

const catItems = [
  { name: 'Sports' },
  { name: 'News' },
  { name: 'Technology' }
];
const Categories = () => {
  const [category,setCategory] = React.useState([]);
  React.useEffect(() =>{
    fetchCategory();
  },[]  );
  const fetchCategory = async()=>{
    let resultCat = await HttpClient.requestData("category", "GET");
    if (resultCat && resultCat.success) {
      setCategory(resultCat.data);
    }
  };
  return (
    
     <div className="item-list">
      <Sidebar />
      <h1>Categories</h1>
      <div className='cat-list'>
        <table>
          <tr>
            <th width={400}>Name</th>
            <th>Status</th>
          </tr>
          {
            category.map((data)=>(

            <tr>
              <td align='left'>{data.name}</td>
              <td>Active</td>
            </tr>

            ))
          }
        </table>

      </div>
      
      
     </div>
    
    
  );
};


export default Categories;