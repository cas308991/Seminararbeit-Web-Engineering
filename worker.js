
onmessage = function (event) {
    const url = event.data.url;
    const method = event.data.method;
    const bodydata = event.data.bodydata;

    fetch(url, {
        method: method,
        body: bodydata,
        headers: {
            "Content-Type": "application/json",
        }
    })
        .then(res => res.json())
        .then(data => postMessage(data))
        .catch(err => self.postMessage({ error: "Error: " + err }));

};

