
const DBerror = (error) => {
    let errorLog = JSON.parse(JSON.stringify(error))
    // console.log('error', errorLog);
    if (errorLog.code && errorLog.code == 11000) {
        return `${Object.keys(errorLog.keyValue)[0]} is already exists`;
    } else if(errorLog.name && errorLog.name == "ValidationError") {
        let message = errorLog._message.split(" ")[0] + " -";
        let objToArry= Object.keys(errorLog.errors);
        objToArry.forEach(function(key, i) {
            console.log('key, i', key, i);
            message += ` ${key} ${Number(objToArry.length-1) != i ? "And" :"is required."}`
        });
        return message;
    } else {
        return `Server error. Please try again.`;
    }
}

module.exports = {
    DBerror
}