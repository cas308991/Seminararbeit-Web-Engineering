onmessage = function (event) {
    const url = event.data.url;
    const method = event.data.method;
    const bodydata = event.data.bodydata;

    //call backend
    fetch(url, {
        method: method,
        body: bodydata,
        headers: {
            "Content-Type": "application/json",
        }
    })
        .then(res => res.json())                //convert to JSON
        .then(data => postMessage(data))        //post to main script
        .catch(err => self.postMessage({ error: "Error: " + err })); //error handling

};

