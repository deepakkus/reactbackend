import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";

async function requestData(url, method, params = null) {
  let apiUrl = process.env.REACT_APP_BASE_URL + "/api/v1/" + url;
  console.log(apiUrl);
  let token = "";
  let user = JSON.parse(sessionStorage.getItem("adminData"));
  if (user != null && Object.keys(user).length > 0) {
    token = user.token;
  } else {
  }
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append(
    "Access-Control-Allow-Origin",
    process.env.REACT_APP_BASE_URL
  );
  myHeaders.append("Authorization", token);
  myHeaders.append("usertype", "Admin");

  var options = {
    method: method,
    headers: myHeaders,
    redirect: "follow",
  };
  console.log(options);
  if (method === "DELETE") {
    // options['body'] = none;
  } else if (method !== "GET") {
    options["body"] = JSON.stringify(params);
  }
  return await fetch(apiUrl, options)
    .then((res) => res.json())
    .then(
      (result) => {
        // console.log("result", result);
        return result;
      },
      (error) => {}
    );
}

async function requestFile(url, method, params = null) {
  let apiUrl = process.env.REACT_APP_BASE_URL + "/api/v1/" + url;
  var myHeaders = new Headers();
  myHeaders.append(
    "Access-Control-Allow-Origin",
    process.env.REACT_APP_BASE_URL
  );
  myHeaders.append(
    "Authorization",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsInBhc3N3b3JkIjoiMTIzNDU2NzgiLCJmdWxsbmFtZSI6IkFkbWluIiwiaWF0IjoxNjIwNjMxNTg5fQ.S2BvLPIWLoY-3Bi5juCK91Y3nhP6NfvXwQjM7C-7wE4"
  );

  var requestOptions = {
    method: method,
    headers: myHeaders,
    body: params,
    redirect: "follow",
  };

  return await fetch(apiUrl, requestOptions)
    .then((res) => res.json())
    .then(
      (result) => {
        // console.log("result", result);
        return result;
      },
      (error) => {}
    );
}

export default {
  requestData,
  requestFile,
};
