
const application = {
    events: {},
    data: {},
    environment: {
        setData: null
    }
};

const on = (event, callback) => {
    const events = application.events;
    events[event] = callback;    
};

const emit = async (event, args, id) => {
    try {
        let callback = application.events[event];
        if (callback == null) {
            callback = () => {
                return null;
            }
        }
            
        let data = null;
        let isError = false;
        try {
            let p = callback(...args);
            try {
                // If p is a promise
                if (p != null && p.then) {
                    data = await p;                      
                } else {
                    data = p;
                }
                
            } catch(e) {
                error(e);
                data = e;
                isError = true;
            } 
        } catch(e) {
            log("Error during callback for ", callback.toString(), e);
        }
        let dataString = "";
        if (data != null) {
            dataString = JSON.stringify(data);
        }
         _sync_callback(id, isError, dataString);  

    } catch(e) {
        log(e);
    }
};


const getData = (key, def) => {
    if (application?.data[key] == undefined) {
        return def;
    }
    if (application.data[key] == null) {
        return null;
    }
    return JSON.parse(application.data[key]);
}

const setData = (key, value, persist = true) => {
    if (persist) {
        _sync_setData(key, JSON.stringify(value));
    }
    application.data[key] = value;
}

// log("App Started");