import express from 'express'
import { resolve } from 'path'
import { myConn, initDB, execSQL } from './mysql/conn.mysql.js'
import ejs from 'ejs'

const __dirname = resolve()
const app = express()
// app.use(express.static('public'))

//apply middleware to access request body
app.use(express.urlencoded({ extended: true }))
//apply middleware to access ejs and set default ejs path to ''./views
app.set('view engine', 'ejs')
app.set('views', './views')


//check if codetest1 is already existed
execSQL('use codetest1')
    .then(result => {
        //if db is existed, no need to init
        console.log('db existed!\nPress Ctrl+C to quit!')
    }, reason => initDB())//if db is not existed, initialize the db



//define the root route, get all member and reward info from db and send them to index.ejs to show 
app.get('/', async (req, res) => {
    const result = await execSQL("select * from member")
    const result1 = await execSQL("select * from reward")
    res.render('index.ejs', {
        memberList: result,
        rewardList: result1
    })
})

//define '/add' route to add new member or reward
app.post('/add', (req, res) => {
    const { addType, addName } = req.body
    //find info based on add type(table name is same as type name) 
    execSQL(`select * from ${addType}`)
    .then((result) => {
        if (addType === 'member'){
            /*
                if add type is member, insert a new data into member table, id+1, and make rewardID NULL.
                we need reward or member list here to get the length which is the last id. 
                So that we can get new id = old id + 1
            */
            execSQL(`insert into member values(${result.length + 1}, '${addName}', NULL)`)
            //show use congrat info when success, error info when failed
            .then(result => res.send("congrat! add member successfully!"), reason => {
                res.send("Name is existed!")
            })
        }else{
            //if add type is reward, insert a new data into reward table, id+1
            execSQL(`insert into reward values(${result.length + 1}, '${addName}')`)
            //show if adding is successful or not
            .then(result => res.send(`congrat! add ${addType} successfully!`), reason => {
                res.send(`${addType} is existed!`)
            })
        }
        
    }).catch(err => {
        console.log(err)
    })

})

//define '/assignreward' route to assign reward to member
app.post('/assignreward', (req, res) => {
    const { selectMem, selectRew } = req.body
    //get rewardID of selected reward
    execSQL(`select rewardID from reward where rewardName = '${selectRew}'`)
        .then(result => {
            //find the selected member in member table and set the new rewardID 
            execSQL(`update member set rewardID = '${result[0].rewardID}' where memberName = '${selectMem}'`)
                .then(result => {
                    res.send("Congrats! Reward is assigned to the member successfully")
                }, reason => {
                    res.send("Assignment failed!")
                })
        }).catch(err => {
            console.log(err)
        })
})

//define '/searchmember' route to search member
app.post('/searchmember', (req, res) => {
    const { searchMem } = req.body
    //find the selected member
    execSQL(`select * from member where memberName = '${searchMem}'`)
        .then(result => {
            //check if the member is existed, if true, length is not 0
            if (result.length != 0) {
                //find reward name from reward table based on rewardID
                execSQL(`select rewardName from reward where rewardID = '${result[0].rewardID}'`)
                    .then(result => {
                        //if the rewardID is not NULL(member does have reward), length is not 0
                        if (result.length !== 0){
                            //send member name and reward name to ejs
                            res.render('searchResult.ejs', {
                                memberName: searchMem,
                                memberReward: result[0].rewardName
                            })
                        }else{
                            //if the rewardID is NULL(member does not have reward), length is 0. remind users.
                            res.render('searchResult.ejs', {
                                memberName: searchMem,
                                memberReward: 'This member does not have rewards'
                            })
                        }
                        
                    })
                    //if length is not true, show error message to users
            } else res.send("The member name is not existed!")


        })
})

//define '/delete' route to delete member
app.post('/delete', async (req, res) => {
    const { delType, delName } = req.body
    //define colomn name(memberName or rewardName)
    let colName = delType + 'Name'
    //when member is going to be deleted
    if (delType === 'member'){
        //select member info when member name is selected name
        execSQL(`select * from ${delType} where ${colName} = '${delName}'`)
        .then(result=>{
            //when data is in the db
            if (result.length !== 0){
                //remove selected data from db
                execSQL(`delete from ${delType} where ${colName} = '${delName}'`)
                .then(result => res.send(`congrat! delete ${delType} successfully!`), reason => {
                    res.send(`${delType} is not existed!`)
                })
                //when data is not in db, show error message
            }else res.send(`The member name is not existed!`)
        })
        
    }
    //when reward is going to be deleted, get rewardID info from reward table
    let rewardId = await execSQL(`select rewardID from reward where rewardName = '${delName}'`)
    //show error info when selected reward is not existed
    if (rewardId.length === 0) res.send(`Sorry the reward is not existed!`)
    //get reward id
    rewardId = rewardId[0].rewardID
    //select member info based on selected rewardId
    let memberInfo = await execSQL(`select * from member where rewardID = '${rewardId}'`)
    //if rewardId is not associated by any members. length should be 0
    if (memberInfo.length === 0){
        execSQL(`delete from ${delType} where ${colName} = '${delName}'`)
        .then(result => res.send(`congrat! delete ${delType} successfully!`), reason => {
            res.send(`${delType} is not existed!`)
        })
        /*
            if rewardId is associated by any members. length should not be 0, 
            we need to update the associated member's rewardID to NULL then delete reward.(Because of pk and fk)
        */
    }else{
        execSQL(`update member set rewardID = NULL where rewardID = '${rewardId}'`)
        .then(result=>{
            execSQL(`delete from ${delType} where ${colName} = '${delName}'`)
            .then(result => res.send(`congrat! delete ${delType} successfully!`), reason => {
                res.send(`${delType} is not existed!`)
            })
        })
    }
})



//when user press ctrl+c, close connection of mysql and exit and application
process.on('SIGINT', ()=>{
    console.log('BYE BYE!')
    myConn.end()
    process.exit()
})

export default app