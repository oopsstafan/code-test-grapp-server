import mysql from 'mysql'

//connect to mysql with config
//PLease input your mysql config(password and port)
export const myConn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '333',
    port: 3306,
})

myConn.connect(err=>{
    if (err) throw err
    console.log("MySQL is connected!")   
})

//create a function to execuate sql commands. Make them promise to prevent callback hell
export const execSQL = (sql)=>{
    const p = new Promise((resolve, reject)=>{
        myConn.query(sql, (err, result)=>{
            if (err){
                reject(err)
                return
            }else resolve(result)
        })
    })

    return p
}

//define a function to initialize the mysql database
export const initDB = ()=>{
    //create new database codetest1 and use it
    execSQL("create database codetest1")
    .then(result=> execSQL("use codetest1"))
    //create new reward table with rewardID(pk) and rewardName
    .then(result=> execSQL("create table reward(rewardID int NOT NULL, rewardName varchar(50) NOT NULL UNIQUE, PRIMARY KEY (rewardID))"))
    .then(result=> console.log("reward table is inited!"))
    //create new member table with memberID(pk), memberName, and rewardID(fk)
    .then(result=> execSQL("create table member(memberID int NOT NULL, memberName varchar(50) NOT NULL UNIQUE, rewardID int, PRIMARY KEY (memberID), FOREIGN KEY (rewardID) REFERENCES reward(rewardID))"))
    //initialize member with id 1, memberName 'kevin' and no reward assigned which is NULL
    .then(result=> execSQL("insert into member values(1, 'kevin', NULL)"))
    .then(result=> console.log("member table is inited!\nPress Ctrl+C to quit!"))
    .catch(reason=>{
        console.log(reason)
    })
    
}
