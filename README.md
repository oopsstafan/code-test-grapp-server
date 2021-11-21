## Getting Started

Please make sure you have MySQL installed on your machine, before running app, try to config your root info and config mysql/conn.mysql.js file.

When MySQL is ready to go, run 'node server.js' to start the server, then browse "http://localhost:8000/" to start.



## Introduction
This is a small web application created by node.js along with MySQL. On the page, you can create new member or reward, assign reward to member, search member info by member name, and delete member or reward.

## Assumptions
1. When you start the application, I initialized a member 'kevin'. Member info includes member id(pk), member name, and reward id(fk); Reward info includes reward id(pk) and reward name.
2. No reward is initialized and you need to create one
3. A member can only be assigned one reward
4. Validations include new member or reward name can not be existed, when searching, deleting member or reward, they must be existed


## Resources
Node.js
mysql
express
ejs

## Timeline
11/18 Start coding
11/19 Finish coding
11/20 Edit comments and README.md file, push "V1" to github

## Thank you for your opportunity!