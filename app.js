import express from 'express'
import { resolve } from 'path'
import { myConn, initDB, execSQL } from './mysql/conn.mysql.js'

const __dirname = resolve()
const app = express()
// app.use(express.static('public'))

//apply middleware to access request body
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
//apply middleware to access ejs and set default ejs path to ''./views


//check if codetest1 is already existed
execSQL('use codetest1')
    .then(result => {
        //if db is existed, no need to init
        console.log('db existed!\nPress Ctrl+C to quit!')
    }, reason => initDB())//if db is not existed, initialize the db



//define /list route, get all member and reward info so that they can be shown on frontend
app.get('/list', async (req, res) => {
    const { listType } = req.query
    const result = await execSQL("select * from member")
    const result1 = await execSQL("select * from reward")
    if (listType === 'member') res.send({ status: 1, data: result })
    else res.send({ status: 1, data: result1 })

})


//define /add route and add new member or reward into the db
app.post('/add', (req, res) => {
    const { addType, addName } = req.body
    execSQL(`select * from ${addType}`)
        .then((result) => {
            if (addType === 'member') {
                /*
                    if add type is member, insert a new data into member table, id+1, and make rewardID NULL.
                    we need reward or member list here to get the length which is the last id. 
                    So that we can get new id = old id + 1
                */
                execSQL(`insert into member values(${result.length + 1}, '${addName}', NULL)`)
                    //return status = 1 when success, -1 when unsuccess
                    .then(result => res.send({ status: 1, data: result }), reason => {
                        res.send({ status: -1, msg: "This user is existed!" })
                    })
            } else {
                //if add type is reward, insert a new data into reward table, id+1
                execSQL(`insert into reward values(${result.length + 1}, '${addName}')`)
                    //show if adding is successful or not
                    .then(result => res.send({ status: 1, data: result }), reason => {
                        res.send({ status: -1, msg: "This reward is existed!" })
                    })
            }

        }).catch(err => {
            throw err
        })
})

//define /assignreward route to assign reward to member
app.post('/assignreward', (req, res) => {
    const { selectMem, selectRew } = req.body
    //if user want to unassign the reward to no reward, set the rewardID to NULL in the db
    if (selectRew === 'empty') {
        execSQL(`update member set rewardID = NULL where memberName = '${selectMem}'`)
            .then(result => {
                res.send({ status: 1, data: result })
            }, reason => {
                res.send({ status: -1, msg: "Assignment failed" })
            })
    }
    //get rewardID of selected reward
    execSQL(`select rewardID from reward where rewardName = '${selectRew}'`)
        .then(result => {
            //find the selected member in member table and set the new rewardID 
            execSQL(`update member set rewardID = '${result[0].rewardID}' where memberName = '${selectMem}'`)
                .then(result => {
                    res.send({ status: 1, data: result })
                }, reason => {
                    res.send({ status: -1, msg: "Assignment failed" })
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
            if (result.length !== 0) {
                //find reward name from reward table based on rewardID
                execSQL(`select rewardName from reward where rewardID = '${result[0].rewardID}'`)
                    .then(result => {
                        //if the rewardID is not NULL(member does have reward), length is not 0
                        if (result.length !== 0) {
                            //send member name and reward name to frontend
                            res.send({
                                status: 1, data: {
                                    memberName: searchMem,
                                    memberReward: result[0].rewardName
                                }
                            })
                        } else {
                            //Remind users when rewardID is NULL(member does not have reward)
                            res.send({
                                status: 1, data: {
                                    memberName: searchMem,
                                    memberReward: 'This member does not have rewards'
                                }
                            })
                        }

                    })
                //if no member data is found, send error msg. 
            } else res.send({ status: -1, msg: 'This member is not existed!' })


        })
})

//define '/delete' route to delete member
app.post('/delete', async (req, res) => {
    const { delType, delName } = req.body
    //when member is going to be deleted
    if (delType === 'member') {
        //find selected member info
        execSQL(`select * from member where memberName = '${delName}'`)
            .then(result => {
                //when data is in the db
                if (result.length !== 0) {
                    //remove selected data from db
                    execSQL(`delete from member where memberName = '${delName}'`)
                        .then(result => res.send({ status: 1, data: result }))
                    //when data is not in db, show error message
                } else res.send({ status: -1, msg: `The member is not existed!` })
            })

    }
    if (delType === 'reward') {
        //when reward is going to be deleted, get rewardID info from reward table
        let rewardId = await execSQL(`select rewardID from reward where rewardName = '${delName}'`)
        //show error info when selected reward is not existed
        if (rewardId.length === 0) res.send({ status: -1, msg: `Sorry the reward is not existed!` })
        //get reward id
        rewardId = rewardId[0].rewardID
        //select member info based on selected rewardId
        let memberInfo = await execSQL(`select * from member where rewardID = '${rewardId}'`)
        //if rewardId is not associated by any members. length should be 0
        if (memberInfo.length === 0) {
            execSQL(`delete from reward where rewardName = '${delName}'`)
                .then(result => res.send({ status: 1, data: result }))
            /*
                if rewardId is associated by any members. length should not be 0, 
                we need to update the associated member's rewardID to NULL then delete reward.(Because of pk and fk)
            */
        } else {
            execSQL(`update member set rewardID = NULL where rewardID = '${rewardId}'`)
                .then(result => {
                    execSQL(`delete from reward where rewardName = '${delName}'`)
                        .then(result => res.send({ status: 1, data: result }))
                })
        }
    }

})



//when user press ctrl+c, close connection of mysql and exit and application
process.on('SIGINT', () => {
    console.log('BYE BYE!')
    myConn.end()
    process.exit()
})

export default app