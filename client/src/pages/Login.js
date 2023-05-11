import * as React from "react";
import Input from "../Components/Input";
import Container from "../Components/Container";
import Button from "../Components/Button";
import Form from "../Components/Form";
import HttpClient from "../utils/HttpClient";
//import { useRouter } from 'next/router'
import { reactLocalStorage } from "reactjs-localstorage";
import Dropdown from "../Components/Dropdown";
import PropTypes from "prop-types";
const countryList = [
  { value: "india", label: "India" },
  { value: "us", label: "US" },
  { value: "australia", label: "Australia" }
];
const Login =() =>{
  
  const [state, setState] = React.useState({
    email: "",
    password: "",

    errors: false
  });
  const [form, setForm] = React.useState({
    country: null,

  });
  const { email, errors, password } = state;

  const handleChange = React.useCallback(({ target: { name, value } }) => {
    setState((prevState) => ({
      ...prevState,
      [name]: value
    }));
  }, []);
  const onHandleChange = React.useCallback((value, name) => {
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  const onValidate = (value, name) => {
    setError(prev => ({
      ...prev,
      [name]: { ...prev[name], errorMsg: value }
    }));
  }
  const [error, setError] = React.useState({
    country: {
      isReq: true,
      errorMsg: '',
      onValidateFunc: onValidate
    }
  });
  const validateForm = () => {
    let isInvalid = false;
    Object.keys(error).forEach(x => {
      const errObj = error[x];
      if (errObj.errorMsg) {
        isInvalid = true;
      } else if (errObj.isReq && !form[x]) {
        isInvalid = true;
        onValidate(true, x);
      }
    });
    return !isInvalid;
  }
 // const router = useRouter();

  const handleSubmit = async(e) => {
    e.preventDefault();
    const isValid = validateForm();
    const errors = !email || !password;
    setState((prevState) => ({
      ...prevState,
      errors
    }));
    let data = { email: email, password: password };
    let result = await HttpClient.requestData("admin/login", "POST", data);
    if (result && result.status) {
      console.log("res-"+JSON.stringify(result))
      window.location.href = "/dashboard";
    }
    //if (!errors) alert(JSON.stringify({ email, password,form }, null, 4));
  };

  return (
    <Container>
      <Form background="#222B36" borderRadius="10px" onSubmit={handleSubmit}>
        
        <Input
          required
          icon="email"
          type="email"
          name="email"
          placeholder="Username..."
          value={email}
          errors={errors}
          onChange={handleChange}
        />
        <Input
          required
          icon="password"
          type="password"
          name="password"
          placeholder="Password..."
          value={password}
          errors={errors}
          onChange={handleChange}
        />
        
        <Button type="submit" margin="20px 0 20px 0">
          Log in
        </Button>
        
      </Form>
    </Container>
  );
}
export default Login;