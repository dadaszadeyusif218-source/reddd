const API_URL = "http://195.26.245.5:9505/api"
async function login(event) {
    event.preventDefault()
    const user = {
        username: document.getElementById("username").value,
        password: document.getElementById("password").value
    }
    const response=await fetch(API_URL+ "/auth",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(user)
    })
    if(!response.ok){
        alert("ошибка")
    }
    const result =await response.json();
    localStorage.setItem("token",result.body.token);
    location.href="index.html"
}