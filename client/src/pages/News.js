import * as React from 'react';
import {Row,Col } from "reactstrap";
import HttpClient from "../utils/HttpClient";
import Sidebar from "../Components/Sidebar";
import moment from "moment";
import { DataGrid } from '@mui/x-data-grid';
const News = () => {
    const [newsResult,setNewsResult] = React.useState([]);
  React.useEffect(() =>{
    fetchNewsResult();
  },[]  );
  const fetchNewsResult= async()=>{
    let resultCat = await HttpClient.requestData("news", "GET");
    console.log(resultCat)
    if (resultCat && resultCat.success) {
      setNewsResult(resultCat.data);
    }

    
  };
 
  const columns = [
    { field: 'title', headerName: 'Title', width: 130 },
    { field: 'description', headerName: 'Description', width: 130 }
    ];
    return (
        <div className="item-list">
            <Sidebar />
            
            <h1>News</h1>
            <div className="news-list">
            <DataGrid
  columns={columns}
  rows={newsResult}
  getRowId={row => row._id}
/>

       
            </div>
            
        </div>
    );
};

export default News;