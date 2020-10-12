var express = require('express')
var router = express.Router()
const {findAllUser}  = require('../utils/sql')
router.get('/test',function(req,res){
    console.log('req')
})

module.exports = router