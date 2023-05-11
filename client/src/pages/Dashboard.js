import * as React from "react";
import Container from "../Components/Container";
import Sidebar from "../Components/Sidebar";
import { Row, Col } from "reactstrap";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
const Dashboard =() =>{
    return (
       
      
      <div>
        <Sidebar />
        
        <h1>Welcme to Dashboard</h1>
      </div>
        
    );
}
export default Dashboard;